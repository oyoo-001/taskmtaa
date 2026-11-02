import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import BrowseTasks from './pages/BrowseTasks';
import Gigs from './pages/Gigs';
import GigDetail from './pages/GigDetail';
import CreateGig from './pages/CreateGig';
import MyGigs from './pages/MyGigs';
import MyGigOrders from './pages/MyGigOrders';
import SellerProfile from './pages/SellerProfile';
import TaskDetail from './pages/TaskDetail';
import CreateTask from './pages/CreateTask';
import MyTasks from './pages/MyTasks';
import MyBids from './pages/MyBids';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import BuyerDashboard from './pages/BuyerDashboard';
import BidsTracking from './pages/buyer/BidsTracking';
import MyPosts from './pages/buyer/MyPosts';
import Analytics from './pages/buyer/Analytics';
import SuccessfulJobs from './pages/buyer/SuccessfulJobs';
import TaskerAnalytics from './pages/tasker/Analytics';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTasks from './pages/admin/AdminTasks';
import AdminGigs from './pages/admin/AdminGigs';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminRatings from './pages/admin/AdminRatings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/browse-tasks" element={<BrowseTasks />} />
        <Route path="/gigs" element={<Gigs />} />
        <Route path="/gigs/orders" element={<ProtectedRoute><MyGigOrders /></ProtectedRoute>} />
        <Route path="/gigs/create" element={<ProtectedRoute><CreateGig /></ProtectedRoute>} />
        <Route path="/gigs/:id/edit" element={<ProtectedRoute><CreateGig /></ProtectedRoute>} />
        <Route path="/gigs/:id" element={<GigDetail />} />
        <Route path="/users/:id" element={<SellerProfile />} />
        <Route path="/my-gigs" element={<ProtectedRoute><MyGigs /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route
          path="/tasks/create"
          element={
            <ProtectedRoute>
              <CreateTask />
            </ProtectedRoute>
          }
        />
        <Route path="/create-task" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
        <Route
          path="/my-tasks"
          element={
            <ProtectedRoute>
              <MyTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bids"
          element={
            <ProtectedRoute>
              <MyBids />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        
        {/* Buyer Dashboard Routes */}
        <Route
          path="/buyer"
          element={
            <ProtectedRoute>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/buyer/bids" replace />} />
          <Route path="bids" element={<BidsTracking />} />
          <Route path="posts" element={<MyPosts />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="completed" element={<SuccessfulJobs />} />
        </Route>
        
        {/* Tasker Analytics */}
        <Route path="/tasker/analytics" element={<ProtectedRoute><TaskerAnalytics /></ProtectedRoute>} />

        {/* Admin Console */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="gigs" element={<AdminGigs />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="ratings" element={<AdminRatings />} />
        </Route>
      </Route>
    </Routes>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen className="min-h-screen" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default App;
