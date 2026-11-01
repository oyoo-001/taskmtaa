import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Languages,
  MapPin,
  MessageSquare,
  Pencil,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';
import api from '../lib/api';
import GigCard from '../components/GigCard';
import VerifiedBadge from '../components/VerifiedBadge';
import { useAuth } from '../contexts/AuthContext';
import { formatKenyanDate, formatRelativeTime } from '../utils/dateUtils';

export default function SellerProfile() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['seller-profile', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <UserRound size={48} className="mx-auto mb-4 text-gray-300" />
          <h1 className="text-xl font-semibold text-gray-900">Profile not available</h1>
          <p className="mt-2 text-gray-500">This account may have been removed or suspended.</p>
          <Link to="/gigs" className="btn-primary mt-6 inline-flex px-5 py-2">
            Browse gigs
          </Link>
        </div>
      </div>
    );
  }

  const { user: seller, gigs = [], reviews = [] } = data;
  const isOwnProfile = user?.id === seller.id;
  const rating = Number(seller.rating || 0);
  const skills = seller.skills || [];
  const languages = seller.languages || [];

  const stats = [
    {
      label: 'Completed tasks',
      value: seller.completed_tasks_count || 0,
      icon: CheckCircle2,
      className: 'from-primary-50 to-primary-100 border-primary-200 text-primary-700',
    },
    {
      label: 'Active gigs',
      value: seller.active_gigs_count || 0,
      icon: Sparkles,
      className: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
    },
    {
      label: 'Gigs completed',
      value: seller.completed_gigs_count || 0,
      icon: Clock,
      className: 'from-green-50 to-green-100 border-green-200 text-green-700',
    },
    {
      label: 'Reviews',
      value: seller.reviews_count || 0,
      icon: MessageSquare,
      className: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/gigs"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft size={16} />
          Back to gigs
        </Link>

        {/* Profile header */}
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="h-28 sm:h-36 bg-gradient-to-r from-primary-600 to-primary-800" />
          <div className="px-5 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14">
              <div className="flex items-end gap-4 min-w-0">
                {seller.avatar_url ? (
                  <img
                    src={seller.avatar_url}
                    alt={seller.full_name}
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-white object-cover shadow-lg flex-shrink-0"
                  />
                ) : (
                  <span className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-white bg-primary-100 text-primary-700 text-4xl font-bold flex items-center justify-center shadow-lg flex-shrink-0">
                    {seller.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 pb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-1.5">
                    {seller.full_name}
                    <VerifiedBadge verified={seller.is_verified} size={20} />
                  </h1>
                  {seller.headline && (
                    <p className="mt-0.5 text-sm text-gray-600">{seller.headline}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Star size={14} className="text-yellow-400" fill="currentColor" />
                      <span className="font-semibold text-gray-800">{rating.toFixed(1)}</span>
                      rating
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={14} />
                      Member since {formatKenyanDate(seller.created_at, { month: 'long', year: 'numeric' })}
                    </span>
                    {seller.availability && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        {seller.availability}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <div className="flex flex-wrap gap-2 pb-1">
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil size={15} />
                    Edit profile
                  </Link>
                  <Link
                    to="/my-gigs"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    <Sparkles size={15} />
                    Manage gigs
                  </Link>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-xl border bg-gradient-to-br p-4 ${stat.className}`}
                >
                  <stat.icon size={18} />
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-medium opacity-80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* About */}
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-7 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">About</h2>
              {seller.experience ? (
                <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-700">
                  {seller.experience}
                </p>
              ) : (
                <p className="mt-3 text-gray-500">
                  {isOwnProfile
                    ? 'Add your experience so buyers know what you can do.'
                    : 'This seller has not added an experience summary yet.'}
                </p>
              )}

              {skills.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900">Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Gigs */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-600" />
                  Gigs by {seller.full_name.split(' ')[0]}
                </h2>
                {isOwnProfile && (
                  <Link
                    to="/gigs/create"
                    className="text-sm font-semibold text-primary-700 hover:text-primary-800"
                  >
                    + New gig
                  </Link>
                )}
              </div>

              {gigs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                  <Sparkles size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No active gigs right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {gigs.map((gig) => (
                    <GigCard key={gig.id} gig={gig} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: languages + reviews */}
          <aside className="space-y-6 lg:sticky lg:top-20">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Languages size={16} className="text-primary-600" />
                Languages
              </h2>
              {languages.length > 0 ? (
                <p className="mt-2 text-sm text-gray-600">{languages.join(', ')}</p>
              ) : (
                <p className="mt-2 text-sm text-gray-400">Not specified</p>
              )}

              {seller.availability && (
                <>
                  <h2 className="mt-5 text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Clock size={16} className="text-primary-600" />
                    Availability
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">{seller.availability}</p>
                </>
              )}

              <h2 className="mt-5 text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MapPin size={16} className="text-primary-600" />
                Based in
              </h2>
              <p className="mt-2 text-sm text-gray-600">Kenya</p>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare size={16} className="text-primary-600" />
                  Reviews
                </h2>
                <span className="text-xs text-gray-400">{seller.reviews_count || 0} total</span>
              </div>

              {reviews.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No reviews yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1 truncate">
                          {review.reviewer_name}
                          <VerifiedBadge verified={review.reviewer_verified} size={12} />
                        </p>
                        <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-gray-800 flex-shrink-0">
                          <Star size={12} className="text-yellow-400" fill="currentColor" />
                          {review.rating}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-1 text-sm text-gray-700">{review.comment}</p>
                      )}
                      <p className="mt-1 text-[11px] text-gray-400">
                        {review.task_title ? `${review.task_title} • ` : ''}
                        {formatRelativeTime(review.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
