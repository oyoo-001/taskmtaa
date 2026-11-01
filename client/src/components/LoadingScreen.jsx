import { logo } from '../lib/assets';

/**
 * In-app loading screen shown while auth/route state resolves.
 * Matches the pre-React splash screen by using the same logo.
 */
export default function LoadingScreen({
  className = 'min-h-[60vh]',
  label = 'Loading TaskMtaa...',
}) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <img
        src={logo}
        alt="TaskMtaa logo"
        className="h-20 w-20 rounded-2xl object-cover shadow-lg"
      />
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
