import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useRole } from '../contexts/RoleContext';
import { 
  Bell, MessageSquare, User, LogOut, Plus, Briefcase, 
  ListTodo, X, Settings, LayoutDashboard, Menu, Home,
  TrendingUp, FileText, CheckCircle, ShieldCheck, Sparkles, ClipboardList
} from 'lucide-react';
import { useState } from 'react';
import VerifiedBadge from './VerifiedBadge';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, clearNotification } = useSocket();
  const { currentRole, switchRole, isTasker, isBuyer } = useRole();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setShowMobileMenu(false);
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'nearby_task' && notification.data?.id) {
      navigate(`/tasks/${notification.data.id}`);
    } else if (notification.type === 'message') {
      navigate('/messages');
    }
    clearNotification(notification.id);
    setShowNotifications(false);
  };

  const handleRoleSwitch = (newRole) => {
    switchRole(newRole);
    setShowMobileMenu(false);
    // Navigate to appropriate page based on role
    if (newRole === 'buyer') {
      navigate('/buyer/bids');
    } else {
      navigate('/browse-tasks');
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={isBuyer ? '/buyer/bids' : isTasker ? '/browse-tasks' : '/'} className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-primary-600">TaskMtaa</span>
            </Link>

            {/* Desktop: Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                to="/browse-tasks"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Tasks
              </Link>
              <Link
                to="/gigs"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Gigs
              </Link>
            </div>

            {/* Desktop: Role Toggle (if logged in) */}
            {user && (
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleRoleSwitch('tasker')}
                  className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isTasker
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center space-x-1">
                    <Briefcase size={16} />
                    <span>Find Work</span>
                  </span>
                </button>
                <button
                  onClick={() => handleRoleSwitch('buyer')}
                  className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isBuyer
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center space-x-1">
                    <LayoutDashboard size={16} />
                    <span>Post Jobs</span>
                  </span>
                </button>
              </div>
            )}

            {/* Right Side Icons */}
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
                    }}
                    className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowNotifications(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                        </div>
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <Bell size={40} className="mx-auto mb-2 text-gray-300" />
                            <p>No notifications</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                              <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className="w-full p-4 hover:bg-gray-50 text-left transition-colors"
                              >
                                <p className="font-medium text-gray-900 text-sm mb-1">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600">{notification.message}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Messages */}
                <Link
                  to="/messages"
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MessageSquare size={20} />
                </Link>

                {/* User Menu (Desktop) */}
                <div className="hidden md:block relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full"
                    />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        <div className="p-4 border-b border-gray-200">
                          <p className="font-semibold text-gray-900 flex items-center gap-1">
                            {user.full_name}
                            <VerifiedBadge verified={user.is_verified} />
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="py-2">
                          {isAdmin && (
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:bg-primary-50 transition-colors"
                            >
                              <ShieldCheck size={18} />
                              <span>Admin Console</span>
                            </Link>
                          )}
                          {isTasker && (
                            <Link
                              to="/my-bids"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                            >
                              <ListTodo size={18} />
                              <span>My Bids</span>
                            </Link>
                          )}
                          <Link
                            to="/my-gigs"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <Sparkles size={18} />
                            <span>My Gigs</span>
                          </Link>
                          <Link
                            to="/gigs/orders"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <ClipboardList size={18} />
                            <span>My Gig Orders</span>
                          </Link>
                          {isBuyer && (
                            <Link
                              to="/create-task"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                            >
                              <Plus size={18} />
                              <span>Post Task</span>
                            </Link>
                          )}
                          <Link
                            to="/gigs/create"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <Sparkles size={18} />
                            <span>Create a Gig</span>
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <User size={18} />
                            <span>Profile</span>
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <Settings size={18} />
                            <span>Settings</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-red-600 transition-colors"
                          >
                            <LogOut size={18} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 font-medium px-3 sm:px-4 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {user && showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          ></div>
          
          <div className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 md:hidden overflow-y-auto">
            {/* Role Toggle (Mobile) */}
            <div className="p-4 border-b border-gray-200">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Switch Role</p>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleRoleSwitch('tasker')}
                  className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                    isTasker
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Briefcase size={18} />
                    <span>Find Work</span>
                  </span>
                </button>
                <button
                  onClick={() => handleRoleSwitch('buyer')}
                  className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                    isBuyer
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <LayoutDashboard size={18} />
                    <span>Post Jobs</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="py-2">
              {/* Tasker Menu */}
              {isTasker && (
                <>
                  <button
                    onClick={() => handleNavigation('/')}
                    className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <Home size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Home</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('/browse-tasks')}
                    className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <Briefcase size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Browse Tasks</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('/my-bids')}
                    className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <ListTodo size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">My Bids</span>
                  </button>
                </>
              )}

              {/* Buyer Menu */}
              {isBuyer && (
                <>
                  <button
                    onClick={() => handleNavigation('/create-task')}
                    className="flex items-center space-x-3 w-full px-6 py-4 bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                  >
                    <Plus size={20} />
                    <span className="font-medium">Post New Task</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('/buyer/bids')}
                    className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <TrendingUp size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Track Bids</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('/buyer/my-posts')}
                    className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <FileText size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">My Posts</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('/buyer/analytics')}
                    className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <TrendingUp size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Analytics</span>
                  </button>
                  <button
                    onClick={() => handleNavigation('/buyer/successful-jobs')}
                    className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <CheckCircle size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Successful Jobs</span>
                  </button>
                </>
              )}

              <div className="my-2 border-t border-gray-200"></div>

              {/* Admin link (mobile) */}
              {isAdmin && (
                <button
                  onClick={() => handleNavigation('/admin/dashboard')}
                  className="flex items-center space-x-3 w-full px-6 py-4 bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                >
                  <ShieldCheck size={20} />
                  <span className="font-medium">Admin Console</span>
                </button>
              )}

              {/* Common Links */}
              <button
                onClick={() => handleNavigation('/gigs')}
                className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <Sparkles size={20} className="text-gray-600" />
                <span className="font-medium text-gray-900">Gigs</span>
              </button>
              <button
                onClick={() => handleNavigation('/my-gigs')}
                className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <Sparkles size={20} className="text-gray-600" />
                <span className="font-medium text-gray-900">My Gigs</span>
              </button>
              <button
                onClick={() => handleNavigation('/gigs/orders')}
                className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <ClipboardList size={20} className="text-gray-600" />
                <span className="font-medium text-gray-900">My Gig Orders</span>
              </button>
              <button
                onClick={() => handleNavigation('/profile')}
                className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <User size={20} className="text-gray-600" />
                <span className="font-medium text-gray-900">Profile</span>
              </button>
              <button
                onClick={() => handleNavigation('/profile')}
                className="flex items-center space-x-3 w-full px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <Settings size={20} className="text-gray-600" />
                <span className="font-medium text-gray-900">Settings</span>
              </button>
            </div>

            {/* User Info & Logout */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
              <div className="p-4 flex items-center space-x-3">
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`}
                  alt={user.full_name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate flex items-center gap-1">
                    {user.full_name}
                    <VerifiedBadge verified={user.is_verified} />
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
