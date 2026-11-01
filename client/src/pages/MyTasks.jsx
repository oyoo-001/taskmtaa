import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import TaskCard from '../components/TaskCard';

export default function MyTasks() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', 'my-posted'],
    queryFn: async () => {
      const { data } = await api.get('/tasks/my-posted');
      return data.data;
    },
  });

  const tasks = data?.tasks || [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Posted Tasks</h1>

        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            Failed to load your tasks
          </div>
        )}

        {!isLoading && !error && tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              You haven't posted any tasks yet
            </p>
            <a href="/tasks/create" className="btn btn-primary">
              Post Your First Task
            </a>
          </div>
        )}

        {!isLoading && !error && tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
