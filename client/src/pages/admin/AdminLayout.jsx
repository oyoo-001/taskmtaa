import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  Star,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../../components/LoadingScreen';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/tasks', label: 'Posted Jobs', icon: Briefcase },
  { to: '/admin/gigs', label: 'Gigs', icon: Sparkles },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/admin/ratings', label: 'Ratings', icon: Star },
];

export default function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingScreen className="h-[calc(100vh-4rem)]" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md">
          <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Admin access required</h1>
          <p className="text-gray-600 mb-4">
            Your account does not have permission to view this area.
          </p>
          <NavLink to="/" className="text-primary-600 font-medium hover:underline">
            Return to home
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      <aside className="bg-white border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0 md:w-60">
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Admin Console</h1>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>

        <nav className="flex md:flex-col gap-1 p-2 overflow-x-auto md:overflow-x-visible">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
