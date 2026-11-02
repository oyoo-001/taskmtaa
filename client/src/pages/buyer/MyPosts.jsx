import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { formatRelativeTime, formatKenyanDate } from '../../utils/dateUtils';
import { 
  PlusIcon, 
  MapPinIcon, 
  ClockIcon, 
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PencilIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import ConfirmModal from '../../components/ConfirmModal';
import AlertModal from '../../components/AlertModal';

export default function MyPosts() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [alertModal, setAlertModal] = useState({ isOpen: false });

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tasks/my-posted');
      setTasks(data.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'open' ? 'hidden' : 'open';
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      fetchMyTasks();
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Task Updated',
        message: `Task is now ${newStatus === 'open' ? 'visible' : 'hidden'} to taskers.`
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update task visibility. Please try again.'
      });
    }
  };

  const handleDeleteTask = async (taskId) => {
    setConfirmModal({
      isOpen: true,
      taskId,
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone and will remove all associated bids.',
      type: 'danger'
    });
  };

  const executeDelete = async () => {
    const { taskId } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      await api.delete(`/tasks/${taskId}`);
      fetchMyTasks();
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Task Deleted',
        message: 'The task has been permanently deleted.'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete task. Please try again.'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'hidden': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Posts</h1>
          <p className="text-gray-600 mt-2">Manage your job postings</p>
        </div>
        <button
          onClick={() => navigate('/tasks/create')}
          className="flex items-center px-4 py-2.5 bg-primary-600 text-white rounded-lg
            hover:bg-primary-700 transition-colors font-medium shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Post New Job
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Total Posts</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{tasks.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            {tasks.filter(t => t.status === 'open').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">
            {tasks.filter(t => t.status === 'in_progress').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-3xl font-bold text-gray-600 mt-1">
            {tasks.filter(t => t.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-6">Create your first job posting to get started</p>
          <button
            onClick={() => navigate('/tasks/create')}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg
              hover:bg-primary-700 transition-colors font-medium"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Post a Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link 
                    to={`/tasks/${task.id}`}
                    className="text-xl font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {task.title}
                  </Link>
                  <p className="text-gray-600 mt-2 line-clamp-2">{task.description}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {task.location_name || 'Location not set'}
                    </span>
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Posted {formatRelativeTime(task.created_at)}
                    </span>
                    <span className="font-medium text-primary-600">
                      {task.bids?.length || 0} bid{task.bids?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <div className="text-2xl font-bold text-gray-900">
                    KSh {task.budget}
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Link
                  to={`/tasks/${task.id}`}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 
                    rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  View Details
                </Link>
                
                {(task.status === 'open' || task.status === 'hidden') && (
                  <button
                    onClick={() => handleToggleVisibility(task.id, task.status)}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 
                      rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    {task.status === 'hidden' ? (
                      <>
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Make Visible
                      </>
                    ) : (
                      <>
                        <EyeSlashIcon className="h-4 w-4 mr-2" />
                        Hide
                      </>
                    )}
                  </button>
                )}

                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="flex items-center px-4 py-2 bg-red-50 border border-red-200 text-red-700 
                      rounded-lg hover:bg-red-100 transition-colors font-medium"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={executeDelete}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
