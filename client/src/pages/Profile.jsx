import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Mail,
  Phone,
  Calendar,
  Camera,
  Check,
  Sparkles,
  Globe,
  Clock,
  Pencil,
  X,
  Shield,
} from 'lucide-react';
import { formatKenyanDate } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import VerifiedBadge from '../components/VerifiedBadge';
import ChangePassword from '../components/ChangePassword';
import TwoFactorAuth from '../components/TwoFactorAuth';

export default function Profile() {
  const { user, setUser, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showSecurity, setShowSecurity] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    headline: '',
    experience: '',
    skills: '',
    languages: '',
    availability: '',
  });

  const startEditing = () => {
    setForm({
      full_name: user?.full_name || '',
      phone_number: user?.phone_number || '',
      headline: user?.headline || '',
      experience: user?.experience || '',
      skills: (user?.skills || []).join(', '),
      languages: (user?.languages || []).join(', '),
      availability: user?.availability || 'Available now',
    });
    setFormError('');
    setEditing(true);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setFormError('Your name is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      await updateProfile({
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim() || undefined,
        headline: form.headline.trim(),
        experience: form.experience.trim(),
        skills: form.skills,
        languages: form.languages,
        availability: form.availability.trim(),
      });
      setEditing(false);
    } catch (error) {
      setFormError(
        error.response?.data?.message || 'Could not save your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const { data } = await api.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user in context
      setUser({
        ...user,
        ...(data.data.user || {}),
        avatar_url: data.data.user?.avatar_url || data.data.avatar_url,
      });
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(
        error.response?.data?.error?.message ||
          'Failed to upload image. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Edit Profile Form */}
        {editing && (
          <form
            onSubmit={handleSaveProfile}
            className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Pencil size={20} className="text-primary-600" />
                  Edit your profile
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  This section is public on your seller profile and gigs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Close edit form"
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Full name</span>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  className="input mt-1"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Phone number</span>
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => updateField('phone_number', e.target.value)}
                  className="input mt-1"
                  placeholder="+254..."
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Headline</span>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => updateField('headline', e.target.value.slice(0, 255))}
                  className="input mt-1"
                  placeholder="e.g. Reliable house cleaner & compound caretaker"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Experience</span>
                <textarea
                  value={form.experience}
                  onChange={(e) => updateField('experience', e.target.value.slice(0, 5000))}
                  rows={5}
                  className="input mt-1 resize-y"
                  placeholder="Tell buyers about your background, years of experience, past work and what you do best..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Skills</span>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => updateField('skills', e.target.value)}
                  className="input mt-1"
                  placeholder="Cleaning, gardening, tutoring"
                />
                <span className="mt-1 block text-xs text-gray-400">Separate with commas</span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Languages</span>
                <input
                  type="text"
                  value={form.languages}
                  onChange={(e) => updateField('languages', e.target.value)}
                  className="input mt-1"
                  placeholder="English, Kiswahili"
                />
                <span className="mt-1 block text-xs text-gray-400">Separate with commas</span>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Availability</span>
                <select
                  value={form.availability}
                  onChange={(e) => updateField('availability', e.target.value)}
                  className="input mt-1"
                >
                  <option>Available now</option>
                  <option>Available this week</option>
                  <option>Busy</option>
                  <option>Not available</option>
                </select>
              </label>
            </div>

            {formError && (
              <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-5 py-2.5 font-semibold disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save profile'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700"></div>
          
          {/* Profile Content */}
          <div className="px-8 pb-8">
            {/* Avatar Section */}
            <div className="relative -mt-16 mb-6">
              <div className="relative inline-block">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-5xl text-white font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Upload Button */}
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : uploadSuccess ? (
                    <Check size={20} className="text-white" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </label>
              </div>

              {/* Upload Status */}
              {uploadSuccess && (
                <div className="mt-2 text-sm text-green-600 flex items-center">
                  <Check size={16} className="mr-1" />
                  Profile picture updated!
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    {user.full_name}
                    <VerifiedBadge verified={user.is_verified} size={22} />
                  </h1>
                  {user.headline && (
                    <p className="text-gray-600 mb-2">{user.headline}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Star size={16} className="text-yellow-400 mr-1" fill="currentColor" />
                      <span className="font-medium">{Number(user.rating || 5).toFixed(2)} rating</span>
                    </div>
                    {user.is_verified && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center">
                        <Check size={14} className="mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Contact Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-2">
                    <Mail size={16} className="text-primary-600" />
                  </div>
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Mail size={18} className="text-gray-400" />
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                  {user.phone_number && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Phone size={18} className="text-gray-400" />
                      <span className="text-gray-700">{user.phone_number}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="text-gray-700">
                      Member since {formatKenyanDate(user.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-2">
                    <Star size={16} className="text-primary-600" />
                  </div>
                  Statistics
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-5 rounded-xl border border-primary-200">
                    <p className="text-3xl font-bold text-primary-700">
                      {user.completed_tasks_count || 0}
                    </p>
                    <p className="text-sm text-primary-600 mt-1">Completed Tasks</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border border-yellow-200">
                    <p className="text-3xl font-bold text-yellow-700">
                      {Number(user.rating || 5).toFixed(1)}
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">Average Rating</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Public seller profile */}
            <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-600" />
                  Seller profile
                </h2>
                <Link
                  to={`/users/${user.id}`}
                  className="text-sm font-semibold text-primary-700 hover:text-primary-800"
                >
                  View public profile
                </Link>
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-semibold text-gray-900">Experience</h3>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {user.experience || 'No experience added yet. Add it so buyers know what you can do.'}
                </p>
              </div>

              {(user.skills?.length > 0 || user.languages?.length > 0 || user.availability) && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-primary-600" />
                      Skills
                    </h3>
                    {user.skills?.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {user.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs text-gray-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-400">Not set</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <Globe size={14} className="text-primary-600" />
                      Languages
                    </h3>
                    <p className="mt-1 text-gray-700">
                      {user.languages?.length > 0 ? user.languages.join(', ') : 'Not set'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <Clock size={14} className="text-primary-600" />
                      Availability
                    </h3>
                    <p className="mt-1 text-gray-700">{user.availability || 'Not set'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Account Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startEditing}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Edit Profile
                </button>
                <Link
                  to={`/users/${user.id}`}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  View Public Profile
                </Link>
                <Link
                  to="/my-gigs"
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  My Gigs
                </Link>
                <button className="px-6 py-2.5 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium" onClick={() => setShowSecurity(!showSecurity)}>
                  <Shield className="w-4 h-4 inline-block mr-2" />
                  {showSecurity ? 'Hide' : 'Show'} Security Settings
                </button>
              </div>
            </div>

            {/* Security Settings */}
            {showSecurity && (
              <div className="mt-8 space-y-6">
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-600" />
                    Security Settings
                  </h2>
                  
                  <div className="space-y-6">
                    <ChangePassword />
                    <TwoFactorAuth />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
