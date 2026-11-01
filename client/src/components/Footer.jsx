/**
 * Site footer with company attribution.
 * The year is computed at render time so it stays current.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center text-sm">
        <p>
          Powered by{' '}
          <span className="font-semibold text-white">McOkoth Technologies</span>
        </p>
        <span className="hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <p>
          &copy; {year} . All rights reserved.
        </p>
      </div>
    </footer>
  );
}
