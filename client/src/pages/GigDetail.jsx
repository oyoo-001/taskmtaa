import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import { formatKenyanDate, formatRelativeTime } from '../utils/dateUtils';

export default function GigDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [requirements, setRequirements] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['gig', id],
    queryFn: async () => {
      const { data } = await api.get(`/gigs/${id}`);
      return data.data;
    },
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/gig-orders', {
        gig_id: Number(id),
        requirements: requirements.trim() || undefined,
      });
      return data.data;
    },
    onSuccess: () => {
      setOrderSuccess(true);
      setShowOrderForm(false);
      setRequirements('');
      queryClient.invalidateQueries({ queryKey: ['gig-orders'] });
      queryClient.invalidateQueries({ queryKey: ['received-gig-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-gigs'] });
    },
    onError: (err) => {
      setOrderError(err.response?.data?.message || 'Could not send your request. Please try again.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !data?.gig) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Sparkles size={48} className="mx-auto mb-4 text-gray-300" />
          <h1 className="text-xl font-semibold text-gray-900">Gig not available</h1>
          <p className="mt-2 text-gray-500">
            This gig may have been paused or removed by its owner.
          </p>
          <Link to="/gigs" className="btn-primary mt-6 inline-flex px-5 py-2">
            Browse other gigs
          </Link>
        </div>
      </div>
    );
  }

  const { gig, seller, reviews = [] } = data;
  const isOwner = user?.id === gig.seller_id;
  const sellerRating = Number(seller?.rating || 0);
  const sellerSkills = seller?.skills || [];
  const sellerLanguages = seller?.languages || [];
  const galleryImages = (gig.image_urls || []).filter(Boolean);
  const galleryThumbnails = (gig.image_thumbnails || []).filter(Boolean);
  const activeImageIndex = Math.min(
    activeImage,
    Math.max(galleryImages.length - 1, 0)
  );

  const handleOrder = (e) => {
    e.preventDefault();
    setOrderError('');
    orderMutation.mutate();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/gigs"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft size={16} />
          Back to gigs
        </Link>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="relative h-48 sm:h-72 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800">
                {galleryImages.length > 0 ? (
                  <>
                    <img
                      src={galleryImages[activeImageIndex]}
                      alt={`${gig.title} preview ${activeImageIndex + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-7xl font-bold text-white/20 select-none">
                      {(seller?.full_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary-700">
                  {gig.subcategory || gig.category}
                </span>
                {galleryImages.length > 1 && (
                  <span className="absolute bottom-4 left-4 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
                    {activeImageIndex + 1} / {galleryImages.length}
                  </span>
                )}
                {gig.status === 'paused' && (
                  <span className="absolute bottom-4 right-4 rounded-full bg-yellow-400/95 px-3 py-1 text-xs font-semibold text-yellow-900">
                    Paused
                  </span>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-b border-gray-100 p-3">
                  {galleryImages.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`View image ${index + 1}`}
                      aria-pressed={index === activeImageIndex}
                      className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        index === activeImageIndex
                          ? 'border-primary-600'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={galleryThumbnails[index] || url}
                        alt={`${gig.title} thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="p-5 sm:p-7">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{gig.title}</h1>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  {gig.category}
                  {gig.subcategory ? ` · ${gig.subcategory}` : ''}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
                  <Link
                    to={`/users/${gig.seller_id}`}
                    className="flex items-center gap-2 min-w-0 hover:text-primary-600"
                  >
                    {seller?.avatar_url ? (
                      <img
                        src={seller.avatar_url}
                        alt={gig.seller_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center">
                        {(gig.seller_name || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="font-medium text-gray-900 flex items-center gap-1">
                      {gig.seller_name}
                      <VerifiedBadge verified={gig.seller_verified} size={15} />
                    </span>
                  </Link>

                  <span className="inline-flex items-center gap-1">
                    <Star size={16} className="text-yellow-400" fill="currentColor" />
                    <span className="font-semibold text-gray-900">{sellerRating.toFixed(1)}</span>
                    <span className="text-gray-500">
                      ({seller?.reviews_count || 0} review{(seller?.reviews_count || 0) === 1 ? '' : 's'})
                    </span>
                  </span>

                  {gig.completed_orders_count > 0 && (
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <ShieldCheck size={16} className="text-green-600" />
                      {gig.completed_orders_count} completed order{gig.completed_orders_count === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                <div className="mt-6 border-t border-gray-100 pt-5">
                  <h2 className="font-semibold text-gray-900">About this gig</h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-700">
                    {gig.description}
                  </p>
                </div>

                {gig.notes && (
                  <div className="mt-6 rounded-lg border border-primary-100 bg-primary-50 p-4">
                    <h2 className="font-semibold text-primary-900">Notes for buyers</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-primary-800">
                      {gig.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Seller card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {seller?.avatar_url ? (
                  <img
                    src={seller.avatar_url}
                    alt={seller.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <span className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 text-2xl font-bold flex items-center justify-center">
                    {(seller?.full_name || '?').charAt(0).toUpperCase()}
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/users/${gig.seller_id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600 inline-flex items-center gap-1"
                  >
                    {seller?.full_name || gig.seller_name}
                    <VerifiedBadge verified={seller?.is_verified} size={16} />
                  </Link>
                  {seller?.headline && (
                    <p className="mt-0.5 text-sm text-gray-600">{seller.headline}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Star size={14} className="text-yellow-400" fill="currentColor" />
                      {sellerRating.toFixed(1)} rating
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={14} />
                      Joined {seller?.created_at ? formatKenyanDate(seller.created_at, { month: 'long', year: 'numeric' }) : 'recently'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles size={14} />
                      {seller?.active_gigs_count || 0} active gig{(seller?.active_gigs_count || 0) === 1 ? '' : 's'}
                    </span>
                  </div>

                  {seller?.experience && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-900">Experience</h3>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-700 line-clamp-6">
                        {seller.experience}
                      </p>
                    </div>
                  )}

                  {sellerSkills.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-900">Skills</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sellerSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/users/${gig.seller_id}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
                  >
                    <UserRound size={16} />
                    View full profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary-600" />
                  Reviews from completed work
                </h2>
                <span className="text-sm text-gray-500">{reviews.length} shown</span>
              </div>

              {reviews.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                  No reviews yet. This seller is new to the marketplace.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {review.reviewer_avatar ? (
                            <img
                              src={review.reviewer_avatar}
                              alt={review.reviewer_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                              {(review.reviewer_name || '?').charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              {review.reviewer_name}
                              <VerifiedBadge verified={review.reviewer_verified} size={13} />
                            </p>
                            {review.task_title && (
                              <p className="text-xs text-gray-500 truncate">{review.task_title}</p>
                            )}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800 flex-shrink-0">
                          <Star size={14} className="text-yellow-400" fill="currentColor" />
                          {review.rating}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(review.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order panel */}
          <aside className="lg:sticky lg:top-20">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-end justify-between">
                <span className="text-sm text-gray-500">Starting at</span>
                <span className="text-3xl font-bold text-gray-900">
                  KSh {Number(gig.amount).toLocaleString()}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} className="text-primary-600" />
                Delivered in {gig.delivery_days} day{gig.delivery_days !== 1 ? 's' : ''}
              </div>

              <div className="mt-5">
                {isOwner ? (
                  <div className="space-y-2">
                    <Link
                      to={`/gigs/${gig.id}/edit`}
                      className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-3 font-semibold"
                    >
                      <Pencil size={18} />
                      Edit this gig
                    </Link>
                    <Link
                      to="/my-gigs"
                      className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Manage my gigs
                    </Link>
                  </div>
                ) : !user ? (
                  <Link
                    to="/login"
                    className="btn-primary flex w-full items-center justify-center px-4 py-3 font-semibold"
                  >
                    Sign in to continue
                  </Link>
                ) : orderSuccess ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
                      <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
                      <span>Request sent! The seller will review and respond.</span>
                    </div>
                    <Link
                      to="/gigs/orders"
                      className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View my gig orders
                    </Link>
                  </div>
                ) : showOrderForm ? (
                  <form onSubmit={handleOrder} className="space-y-3">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">
                        What do you need?
                      </span>
                      <textarea
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value.slice(0, 2000))}
                        rows={4}
                        placeholder="Share details, location, preferred date, and anything the seller should know."
                        className="input mt-1 resize-y"
                      />
                    </label>

                    {orderError && (
                      <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {orderError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={orderMutation.isPending}
                      className="btn-primary w-full px-4 py-3 font-semibold disabled:opacity-60"
                    >
                      {orderMutation.isPending
                        ? 'Sending request...'
                        : `Send request • KSh ${Number(gig.amount).toLocaleString()}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOrderForm(false);
                        setOrderError('');
                      }}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowOrderForm(true)}
                    className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-3 font-semibold"
                  >
                    <BadgeCheck size={18} />
                    Continue
                  </button>
                )}
              </div>

              <p className="mt-4 text-center text-xs text-gray-400">
                You won't be charged here. The seller reviews your request first.
              </p>
            </div>

            {sellerLanguages.length > 0 && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">Languages</h3>
                <p className="mt-1 text-sm text-gray-600">{sellerLanguages.join(', ')}</p>
                {seller?.availability && (
                  <>
                    <h3 className="mt-4 text-sm font-semibold text-gray-900">Availability</h3>
                    <p className="mt-1 text-sm text-gray-600">{seller.availability}</p>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
