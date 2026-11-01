import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  Users, 
  Briefcase,
  ArrowRight,
  Award,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { heroBackground } from '../lib/assets';
import VerifiedBadge from '../components/VerifiedBadge';
import Footer from '../components/Footer';

export default function Home() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    activeTaskers: 0
  });

  // Fetch featured/verified users
  const { data: featuredUsers, isLoading } = useQuery({
    queryKey: ['users', 'featured'],
    queryFn: async () => {
      try {
        // Get top-rated users
        const { data } = await api.get('/users/featured');
        return data.users || [];
      } catch (error) {
        console.error('Failed to fetch featured users:', error);
        return [];
      }
    },
  });

  // Fetch platform stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/analytics/platform');
        setStats({
          totalUsers: data.totalUsers,
          totalTasks: data.totalTasks,
          completedTasks: data.completedTasks,
          activeTaskers: Math.floor(data.totalUsers * 0.3) // Estimate
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="relative bg-primary-800 bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-900/75 via-primary-900/60 to-primary-800/75"
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
              Get Things Done
              <span className="block text-primary-100 mt-2">With Local Taskers</span>
            </h1>
            <p className="text-xl sm:text-2xl text-primary-50 mb-8 max-w-3xl mx-auto drop-shadow">
              Connect with skilled people in your neighborhood for any task, big or small
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/browse-tasks"
                className="btn-primary bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg flex items-center"
              >
                Browse Available Jobs
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link
                to="/create-task"
                className="btn-outline border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold rounded-lg flex items-center"
              >
                Post a Task
                <Briefcase className="ml-2" size={20} />
              </Link>
              <Link
                to="/gigs"
                className="btn-outline border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold rounded-lg flex items-center"
              >
                Explore Gigs
                <Sparkles className="ml-2" size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="text-primary-600" size={32} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-gray-600 mt-1">Active Users</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Briefcase className="text-green-600" size={32} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalTasks.toLocaleString()}</div>
              <div className="text-gray-600 mt-1">Tasks Posted</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="text-blue-600" size={32} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.completedTasks.toLocaleString()}</div>
              <div className="text-gray-600 mt-1">Jobs Completed</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="text-purple-600" size={32} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.activeTaskers.toLocaleString()}</div>
              <div className="text-gray-600 mt-1">Active Taskers</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How TaskMtaa Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting help or finding work is simple and straightforward
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Post Your Task</h3>
              <p className="text-gray-600 text-center">
                Describe what you need done, set your budget, and add your location. It takes just a minute!
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Review Bids</h3>
              <p className="text-gray-600 text-center">
                Nearby taskers submit bids. Check their profiles, ratings, and choose the best fit.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Get It Done</h3>
              <p className="text-gray-600 text-center">
                Your chosen tasker completes the job. Pay securely and rate their work.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Taskers */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Top Rated Taskers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Trusted professionals ready to help with your tasks
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : featuredUsers && featuredUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredUsers.slice(0, 8).map((user) => (
                <Link
                  key={user.id}
                  to={`/users/${user.id}`}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary-500 hover:shadow-lg transition-all cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.full_name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    {user.is_verified && (
                      <div className="absolute top-0 right-1/4 bg-blue-500 rounded-full p-1">
                        <CheckCircle size={20} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-gray-900 text-center mb-2 flex items-center justify-center gap-1">
                    {user.full_name}
                    <VerifiedBadge verified={user.is_verified} />
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center justify-center mb-3">
                    <Star size={18} className="text-yellow-400 fill-current mr-1" />
                    <span className="font-semibold text-gray-900">{Number(user.rating || 5).toFixed(1)}</span>
                    <span className="text-gray-500 text-sm ml-1">
                      ({user.completed_tasks_count || 0} jobs)
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-around text-center text-sm border-t pt-3">
                    <div>
                      <div className="font-bold text-gray-900">{user.completed_tasks_count || 0}</div>
                      <div className="text-gray-600">Jobs</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{Number(user.rating || 5).toFixed(1)}</div>
                      <div className="text-gray-600">Rating</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Featured taskers will appear here soon</p>
            </div>
          )}

          <div className="text-center mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/browse-tasks"
              className="btn-primary inline-flex items-center justify-center px-6 py-3"
            >
              View All Available Tasks
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link
              to="/gigs"
              className="inline-flex items-center justify-center rounded-lg border-2 border-primary-600 px-6 py-3 font-semibold text-primary-700 hover:bg-primary-50"
            >
              Explore Gigs
              <Sparkles className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
