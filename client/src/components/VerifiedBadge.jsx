import { BadgeCheck } from 'lucide-react';

/**
 * Blue verification badge shown next to a user's name.
 * Renders nothing when the user is not verified.
 */
export default function VerifiedBadge({ verified, size = 16, className = '' }) {
  if (!verified) return null;

  return (
    <BadgeCheck
      size={size}
      className={`inline-block flex-shrink-0 text-blue-500 ${className}`}
      aria-label="Verified user"
      title="Verified user"
    />
  );
}
