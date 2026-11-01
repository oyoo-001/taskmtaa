import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  ClipboardDocumentListIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

export default function BuyerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const navigation = [
    { name: 'Bids Tracking', href: '/buyer/bids', icon: ClipboardDocumentListIcon },
    { name: 'My Posts', href: '/buyer/posts', icon: DocumentTextIcon },
    { name: 'Analytics', href: '/buyer/analytics', icon: ChartBarIcon },
    { name: 'Successful Jobs', href: '/buyer/completed', icon: CheckCircleIcon },
    { name: 'My Gigs', href: '/my-gigs', icon: SparklesIcon },
    { name: 'Gig Orders', href: '/gigs/orders', icon: ClipboardDocumentCheckIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-20 left-4 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50"
        >
          {sidebarOpen ? (
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          ) : (
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Sidebar backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="h-full flex flex-col py-6">
          {/* Dashboard Header */}
          <div className="px-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your job postings</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors
                  ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="px-6 pt-6 border-t border-gray-200 space-y-2">
            <button
              onClick={() => navigate('/tasks/create')}
              className="w-full bg-primary-600 text-white px-4 py-2.5 rounded-lg font-medium
                hover:bg-primary-700 transition-colors shadow-sm"
            >
              Post New Job
            </button>
            <button
              onClick={() => navigate('/gigs/create')}
              className="w-full bg-white text-primary-700 border border-primary-200 px-4 py-2.5 rounded-lg font-medium
                hover:bg-primary-50 transition-colors"
            >
              Create a Gig
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
