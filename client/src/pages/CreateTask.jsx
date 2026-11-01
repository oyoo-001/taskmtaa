import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { MapPin, Sparkles } from 'lucide-react';
import api from '../lib/api';

const CATEGORIES = [
  'Housekeeping',
  'Bush & Yard Clearing',
  'Farming & Agriculture',
  'Tutoring & Training',
  'Errands & Delivery',
  'Other'
];

export default function CreateTask() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Housekeeping',
    budget: '',
    location_name: '',
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const navigate = useNavigate();

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const { data } = await api.post('/tasks', taskData);
      return data;
    },
    onSuccess: (data) => {
      navigate(`/tasks/${data.data.task.id}`);
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Failed to create task');
    },
  });

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Reverse geocode to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();

          setFormData({
            ...formData,
            latitude: lat,
            longitude: lng,
            location_name: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          });
        } catch (err) {
          setFormData({
            ...formData,
            latitude: lat,
            longitude: lng,
            location_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          });
        }
        setLocationLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location. Please enter it manually.');
        setLocationLoading(false);
      }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.latitude || !formData.longitude) {
      setError('Please set a location for your task');
      return;
    }

    createTaskMutation.mutate({
      ...formData,
      budget: parseFloat(formData.budget),
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Post a New Task
          </h1>
          <p className="text-gray-600 mb-8">
            Describe your task and connect with local taskers ready to help
          </p>

          {/* Cross-sell: offer a service alongside posting a task */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="mt-0.5 flex-shrink-0 text-primary-600" />
              <div>
                <p className="font-semibold text-primary-900">Also offer what you can do</p>
                <p className="text-sm text-primary-700">
                  Publish a gig so buyers can find and request your services.
                </p>
              </div>
            </div>
            <Link
              to="/gigs/create"
              className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Create a Gig
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="input"
                placeholder="e.g., Compound cleaning needed"
                value={formData.title}
                onChange={handleChange}
                minLength={5}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={6}
                className="input"
                placeholder="Provide detailed information about the task, requirements, and expectations..."
                value={formData.description}
                onChange={handleChange}
                minLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 20 characters
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                className="input"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                Budget (KSh) *
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                required
                min="1"
                step="0.01"
                className="input"
                placeholder="e.g., 1500"
                value={formData.budget}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Set a fair budget for this task
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Location *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="btn btn-outline flex items-center space-x-2"
                >
                  <MapPin size={18} />
                  <span>{locationLoading ? 'Getting location...' : 'Use My Location'}</span>
                </button>
                {formData.latitude && formData.longitude && (
                  <div className="flex-1 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    ✓ Location set
                  </div>
                )}
              </div>
              {formData.location_name && (
                <p className="text-sm text-gray-600 mt-2">
                  📍 {formData.location_name}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {createTaskMutation.isPending ? 'Creating...' : 'Post Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
