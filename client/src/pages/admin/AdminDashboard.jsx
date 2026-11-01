import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  Briefcase,
  BadgeCheck,
  ShieldBan,
  Star,
  MessageSquare,
  TrendingUp,
  Activity
} from 'lucide-react';
import { api } from '../../lib/api';
import VerifiedBadge from '../../components/VerifiedBadge';

function StatCard({ icon: Icon, label, value, tone = 'primary' }) {
  const tones = {
    primary: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`p-2 rounded-lg ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get('/admin/stats');
        if (active) setData(response.data.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
        if (active) setError('Failed to load dashboard data');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  const { stats, recentUsers, recentTasks, recentGigs, recentActions } = data;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Platform overview and moderation activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Users" value={stats.total_users} />
        <StatCard icon={BadgeCheck} label="Verified Users" value={stats.verified_users} tone="green" />
        <StatCard icon={ShieldBan} label="Suspended Users" value={stats.suspended_users} tone="red" />
        <StatCard icon={Briefcase} label="Total Jobs" value={stats.total_tasks} />
        <StatCard icon={TrendingUp} label="Open Jobs" value={stats.open_tasks} tone="green" />
        <StatCard icon={Briefcase} label="Completed Jobs" value={stats.completed_tasks} tone="gray" />
        <StatCard icon={Briefcase} label="Total Gigs" value={stats.total_gigs} tone="primary" />
        <StatCard icon={TrendingUp} label="Active Gigs" value={stats.active_gigs} tone="green" />
        <StatCard icon={Star} label="Average Rating" value={Number(stats.average_rating).toFixed(2)} tone="yellow" />
        <StatCard icon={MessageSquare} label="Messages" value={stats.total_messages} tone="gray" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Newest Users</h3>
            <Link to="/admin/users" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </header>
          <div className="divide-y divide-gray-100">
            {recentUsers.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No users yet</p>
            )}
            {recentUsers.map((user) => (
              <div key={user.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 flex items-center gap-1 truncate">
                    {user.full_name}
                    <VerifiedBadge verified={user.is_verified} />
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Newest Jobs</h3>
            <Link to="/admin/tasks" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </header>
          <div className="divide-y divide-gray-100">
            {recentTasks.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No jobs yet</p>
            )}
            {recentTasks.map((task) => (
              <div key={task.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/tasks/${task.id}`} className="font-medium text-gray-900 hover:text-primary-600 truncate block">
                    {task.title}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">
                    by {task.poster_name} · KSh {Number(task.budget).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs capitalize text-gray-500 whitespace-nowrap">
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Newest Gigs</h3>
            <Link to="/admin/gigs" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </header>
          <div className="divide-y divide-gray-100">
            {(!recentGigs || recentGigs.length === 0) && (
              <p className="p-4 text-sm text-gray-500">No gigs yet</p>
            )}
            {recentGigs && recentGigs.map((gig) => (
              <div key={gig.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/gigs/${gig.id}`} className="font-medium text-gray-900 hover:text-primary-600 truncate block">
                    {gig.title}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">
                    by {gig.seller_name} · KSh {Number(gig.amount).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs capitalize text-gray-500 whitespace-nowrap">
                  {gig.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <header className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <Activity size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">Recent Admin Actions</h3>
        </header>
        <div className="divide-y divide-gray-100">
          {recentActions.length === 0 && (
            <p className="p-4 text-sm text-gray-500">No admin actions recorded yet</p>
          )}
          {recentActions.map((action) => (
            <div key={action.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="text-gray-900">
                  <span className="font-medium">{action.admin_name || 'Admin'}</span>{' '}
                  {action.action.replace(/_/g, ' ')}{' '}
                  <span className="text-gray-500">({action.entity_type} #{action.entity_id})</span>
                </p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
