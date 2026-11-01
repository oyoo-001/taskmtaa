/**
 * IP-based approximate geolocation.
 *
 * Used as a backup when the browser denies or cannot provide device
 * location. Lookups are proxied through the server so the browser does not
 * depend on third-party CORS policies, and results are cached in memory.
 */

// Cache successful lookups for 24 hours to stay well inside free-tier limits.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const lookupCache = new Map();

const isPrivateIp = (ip) => {
  if (!ip) return true;

  const normalised = ip.replace(/^::ffff:/i, '').toLowerCase();

  if (normalised === '::1' || normalised === '0.0.0.0' || normalised === 'localhost') {
    return true;
  }

  // IPv6 unique-local (fc00::/7) and link-local (fe80::/10)
  if (normalised.startsWith('fc') || normalised.startsWith('fd') || normalised.startsWith('fe80')) {
    return true;
  }

  const ipv4 = normalised.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const firstForwarded = (forwardedValue || '').split(',')[0].trim();

  return (firstForwarded || req.ip || req.socket?.remoteAddress || '').replace(/^::ffff:/i, '');
};

const pruneCache = () => {
  const now = Date.now();
  for (const [key, entry] of lookupCache) {
    if (entry.expiresAt <= now) lookupCache.delete(key);
  }
  // If still too large, drop the oldest entries (Map keeps insertion order).
  while (lookupCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = lookupCache.keys().next().value;
    lookupCache.delete(oldestKey);
  }
};

const normaliseResult = ({ latitude, longitude, city, region, country }) => ({
  latitude: Number(latitude),
  longitude: Number(longitude),
  city: city || null,
  region: region || null,
  country: country || null,
});

const lookupIpWhoIs = async (ip) => {
  const url = ip ? `https://ipwho.is/${encodeURIComponent(ip)}` : 'https://ipwho.is/';
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`ipwho.is responded ${response.status}`);

  const data = await response.json();
  if (!data.success || !Number.isFinite(Number(data.latitude)) || !Number.isFinite(Number(data.longitude))) {
    throw new Error(data.message || 'ipwho.is returned no coordinates');
  }

  return normaliseResult({
    latitude: data.latitude,
    longitude: data.longitude,
    city: data.city,
    region: data.region,
    country: data.country,
  });
};

const lookupIpApiCo = async (ip) => {
  const url = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : 'https://ipapi.co/json/';
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`ipapi.co responded ${response.status}`);

  const data = await response.json();
  if (data.error || !Number.isFinite(Number(data.latitude)) || !Number.isFinite(Number(data.longitude))) {
    throw new Error(data.reason || 'ipapi.co returned no coordinates');
  }

  return normaliseResult({
    latitude: data.latitude,
    longitude: data.longitude,
    city: data.city,
    region: data.region,
    country: data.country_name,
  });
};

/**
 * GET /api/v1/geo/ip-location
 * Returns an approximate location derived from the caller's IP address.
 * Always responds 200; `available: false` means no usable location was found.
 */
export const getIpLocation = async (req, res) => {
  const clientIp = getClientIp(req);
  const isPrivate = isPrivateIp(clientIp);

  // For loopback/private addresses (local dev, LAN, most single-host setups)
  // fall back to the server's own egress IP, which is usually the same
  // network as the user.
  const lookupIp = isPrivate ? null : clientIp;
  const cacheKey = lookupIp || 'server-egress';

  const cached = lookupCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ success: true, data: { ...cached.data, cached: true } });
  }

  let location = null;
  let provider = null;

  for (const [name, lookup] of [
    ['ipwho.is', lookupIpWhoIs],
    ['ipapi.co', lookupIpApiCo],
  ]) {
    try {
      location = await lookup(lookupIp);
      provider = name;
      break;
    } catch (error) {
      console.warn(`IP geolocation via ${name} failed: ${error.message}`);
    }
  }

  if (!location) {
    return res.json({
      success: true,
      data: {
        available: false,
        reason: 'lookup_failed',
        approximate: true,
      },
    });
  }

  const data = {
    available: true,
    ...location,
    approximate: true,
    source: 'ip',
    provider,
    privateClient: isPrivate,
  };

  pruneCache();
  lookupCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });

  return res.json({ success: true, data });
};
