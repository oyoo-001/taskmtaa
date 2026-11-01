import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { List, Map, MapPin, Filter, Radar, LocateFixed } from 'lucide-react';
import { api } from '../lib/api';
import TaskCard from '../components/TaskCard';
import TaskMap from '../components/TaskMap';
import { useSocket } from '../contexts/SocketContext';

const CATEGORIES = [
  'All',
  'Housekeeping',
  'Bush & Yard Clearing',
  'Farming & Agriculture',
  'Tutoring & Training',
  'Errands & Delivery',
  'Other'
];

const RADIUS_OPTIONS = [
  { value: 0, label: 'Anywhere' },
  { value: 1000, label: '1 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
  { value: 50000, label: '50 km' },
  { value: 100000, label: '100 km' },
];

const NEARBY_RADII = RADIUS_OPTIONS.filter((option) => option.value > 0);
const DEFAULT_RADIUS = 100000;
const FALLBACK_LOCATION = { latitude: -1.2921, longitude: 36.8219 }; // Nairobi CBD
const MOVE_THRESHOLD_METERS = 500;

const radiusLabel = (value) =>
  RADIUS_OPTIONS.find((option) => option.value === value)?.label || `${value / 1000} km`;

// Great-circle distance in metres, used to ignore tiny GPS jitters.
const distanceMeters = (a, b) => {
  const R = 6371000;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Reminder shown after the results so people know why they may not be
 * seeing every job, with one-tap ways to adjust the search.
 */
function RadiusNudge({ radius, locating, onWiden, onAnywhere, onLocate, onOpenFilters }) {
  const isAnywhere = radius === 0;
  const wider = isAnywhere ? null : NEARBY_RADII.find((option) => option.value > radius);
  const maxRadius = NEARBY_RADII[NEARBY_RADII.length - 1];

  return (
    <div className="mt-6 bg-white border border-primary-100 rounded-xl shadow-sm p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-primary-50 text-primary-600">
          <Radar size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">
            {isAnywhere
              ? "You're seeing jobs from every area"
              : `Only showing jobs within ${radiusLabel(radius)}`}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {isAnywhere
              ? 'Want something closer to home? Narrow the radius to focus on jobs around you.'
              : 'Reached the end and still not seeing what you need? Widen the radius to include more areas.'}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {isAnywhere ? (
              <button
                type="button"
                onClick={() => onWiden(maxRadius.value)}
                className="btn-primary px-4 py-2 text-sm font-semibold rounded-lg"
              >
                Narrow to {maxRadius.label}
              </button>
            ) : (
              <>
                {wider && (
                  <button
                    type="button"
                    onClick={() => onWiden(wider.value)}
                    className="btn-primary px-4 py-2 text-sm font-semibold rounded-lg"
                  >
                    Widen to {wider.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onAnywhere}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Show jobs anywhere
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onLocate}
              disabled={locating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LocateFixed size={16} />
              {locating ? 'Locating...' : 'Use my current location'}
            </button>

            <button
              type="button"
              onClick={onOpenFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Filter size={16} />
              Adjust filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrowseTasks() {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [category, setCategory] = useState('All');
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState(0);
  const [locationSource, setLocationSource] = useState(null); // 'device' | 'ip' | 'fallback'
  const [ipCity, setIpCity] = useState('');
  const { registerLocation } = useSocket();

  // Keep the latest location in a ref so the watch callback can compare
  // without re-subscribing on every state change.
  const positionRef = useRef(null);
  // registerLocation is recreated on every provider render, so hold it in a ref.
  const registerLocationRef = useRef(registerLocation);
  useEffect(() => {
    registerLocationRef.current = registerLocation;
  }, [registerLocation]);

  // Backup location: approximate the user from their IP when the device
  // denies permission or cannot get a fix.
  const applyIpFallback = useCallback(async (reason) => {
    try {
      const { data } = await api.get('/geo/ip-location');
      const info = data?.data;

      if (
        info?.available &&
        Number.isFinite(Number(info.latitude)) &&
        Number.isFinite(Number(info.longitude))
      ) {
        const next = { latitude: Number(info.latitude), longitude: Number(info.longitude) };
        positionRef.current = next;
        setUserLocation(next);
        setLocationSource('ip');
        setIpCity(info.city || info.region || info.country || '');
        setLocationError(null);
        return true;
      }
    } catch (err) {
      console.error('IP location fallback failed:', err);
    }

    // Last resort so the list still works.
    if (!positionRef.current) {
      positionRef.current = FALLBACK_LOCATION;
      setUserLocation(FALLBACK_LOCATION);
      setLocationSource('fallback');
      setLocationError(reason || 'Using Nairobi CBD as a starting point.');
    }
    return false;
  }, []);

  // Smart filter: watch the device position and refresh results when it
  // actually moves (ignoring sub-500 m GPS jitter).
  useEffect(() => {
    if (!navigator.geolocation) {
      applyIpFallback('Geolocation is not supported by your browser.');
      return;
    }

    const handlePosition = (position) => {
      const next = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const previous = positionRef.current;

      if (previous && distanceMeters(previous, next) < MOVE_THRESHOLD_METERS) {
        return;
      }

      positionRef.current = next;
      setUserLocation(next);
      setLocationSource('device');
      setIpCity('');
      setLocationError(null);
      if (previous) {
        setLocationNotice(Date.now());
      }
    };

    const handleError = (error) => {
      console.error('Geolocation error:', error);
      if (positionRef.current) return;

      const reason =
        error?.code === 1
          ? 'Location permission denied. Using your approximate location from your IP address.'
          : 'Unable to get your precise location. Using an approximate location from your IP address.';
      applyIpFallback(reason);
    };

    const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 20000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [applyIpFallback]);

  // Auto-hide the "list updated" notice.
  useEffect(() => {
    if (!locationNotice) return;
    const timer = setTimeout(() => setLocationNotice(0), 6000);
    return () => clearTimeout(timer);
  }, [locationNotice]);

  // Keep socket-based nearby alerts in sync with the current search area.
  useEffect(() => {
    if (!userLocation) return;
    registerLocationRef.current?.(
      userLocation.latitude,
      userLocation.longitude,
      radius > 0 ? radius : DEFAULT_RADIUS
    );
  }, [userLocation, radius]);

  const locateNow = () => {
    if (!navigator.geolocation) {
      applyIpFallback('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        positionRef.current = next;
        setUserLocation(next);
        setLocationSource('device');
        setIpCity('');
        setLocationError(null);
        setLocationNotice(Date.now());
        setLocating(false);
      },
      (error) => {
        console.error('Geolocation refresh error:', error);
        setLocating(false);
        if (positionRef.current) {
          setLocationError('Could not refresh your location right now. Try again in a moment.');
        } else {
          applyIpFallback('Could not access your device location. Using an approximate location from your IP address.');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  };

  // Fetch nearby tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', 'nearby', userLocation, radius, category],
    queryFn: async () => {
      if (!userLocation) return { tasks: [] };

      const params = new URLSearchParams({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        limit: 50,
      });

      if (radius > 0) {
        params.append('radius', radius);
      }

      if (category !== 'All') {
        params.append('category', category);
      }

      const { data } = await api.get(`/tasks/nearby?${params}`);
      return data.data;
    },
    enabled: !!userLocation,
  });

  const tasks = data?.tasks || [];
  const locationLabel =
    radius > 0
      ? `within ${radiusLabel(radius)} of ${
          locationSource === 'ip' ? 'your approximate location' : 'you'
        }`
      : 'across all areas';

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50 overflow-hidden">
      {/* Compact header: label + filter icon */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              Browse Available Jobs
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              Find tasks near you and submit your bid
            </p>
            {locationSource === 'ip' && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] sm:text-xs font-medium text-primary-700 truncate">
                <MapPin size={12} className="flex-shrink-0" />
                Approximate location{ipCity ? `: ${ipCity}` : ''} (via IP) — enable device location for better accuracy
              </p>
            )}
            {locationSource === 'fallback' && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] sm:text-xs font-medium text-yellow-600 truncate">
                <MapPin size={12} className="flex-shrink-0" />
                Precise location unavailable — starting near Nairobi CBD
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`px-3 py-2 flex items-center space-x-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List size={18} />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                aria-label="Map view"
                className={`px-3 py-2 flex items-center space-x-2 border-l border-gray-300 transition-colors ${
                  viewMode === 'map'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Map size={18} />
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>

            {/* Location / category filter icon */}
            <button
              onClick={() => setShowFilters((open) => !open)}
              aria-label="Filter by location and category"
              aria-expanded={showFilters}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                showFilters || category !== 'All' || radius !== DEFAULT_RADIUS
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span className="hidden sm:inline font-medium">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Category"
                  className="input py-2 text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} className="text-primary-600" />
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  aria-label="Search radius"
                  className="input py-2 text-sm"
                >
                  {RADIUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value === 0 ? option.label : `Within ${option.label}`}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={locateNow}
                disabled={locating}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LocateFixed size={16} />
                {locating ? 'Locating...' : 'Update location'}
              </button>

              {userLocation && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="hidden sm:inline">
                    {locationSource === 'ip'
                      ? `Approximate location (IP)${ipCity ? `: ${ipCity}` : ''}`
                      : locationSource === 'fallback'
                        ? 'Using Nairobi CBD'
                        : 'Location detected'}
                  </span>
                  <span className="sm:hidden">
                    {locationSource === 'ip' ? 'Approx. location' : locationSource === 'fallback' ? 'Nairobi CBD' : 'Location on'}
                  </span>
                </div>
              )}
            </div>

            {locationError && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 text-xs text-yellow-600">
                {locationError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content: fills the rest of the viewport and scrolls internally */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              Failed to load tasks. Please try again.
            </div>
          )}

          {!isLoading && !error && tasks.length === 0 && (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <Filter size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                No tasks found in your area
              </p>
              <p className="text-gray-400">
                Try expanding your search radius or changing the category
              </p>
            </div>
          )}

          {!isLoading && !error && tasks.length > 0 && (
            <>
              {/* Results Count */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Found <span className="font-semibold text-gray-900">{tasks.length}</span>{' '}
                  {tasks.length === 1 ? 'task' : 'tasks'} {locationLabel}
                </p>
                {locationNotice > 0 && (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-primary-700">
                    <LocateFixed size={14} />
                    List updated to your new location
                  </p>
                )}
              </div>

              {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="h-[calc(100vh-16rem)] min-h-[320px] rounded-lg overflow-hidden shadow-lg">
                  <TaskMap tasks={tasks} userLocation={userLocation} />
                </div>
              )}
            </>
          )}

          {/* End-of-list reminder: adjust the radius or re-locate */}
          {!isLoading && !error && (
            <RadiusNudge
              radius={radius}
              locating={locating}
              onWiden={setRadius}
              onAnywhere={() => setRadius(0)}
              onLocate={locateNow}
              onOpenFilters={() => setShowFilters(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
