import { Link } from 'react-router-dom';
import { Clock, Star, BadgeCheck } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';

export default function GigCard({ gig }) {
  const sellerInitial = (gig.seller_name || '?').charAt(0).toUpperCase();
  const rating = Number(gig.seller_rating || 0);
  const coverImage =
    gig.thumbnail_url ||
    gig.image_thumbnails?.[0] ||
    gig.image_urls?.[0] ||
    null;

  return (
    <Link
      to={`/gigs/${gig.id}`}
      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all h-full flex flex-col overflow-hidden"
    >
      {/* Cover image (Cloudinary thumbnail) with a gradient fallback */}
      <div className="relative h-36 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800">
        {coverImage ? (
          <>
            <img
              src={coverImage}
              alt={gig.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold text-white/25 select-none">
              {sellerInitial}
            </span>
          </div>
        )}
        <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-primary-700">
          {gig.subcategory || gig.category}
        </span>
        {gig.completed_orders_count > 0 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[11px] font-medium text-white">
            <BadgeCheck size={12} />
            {gig.completed_orders_count} done
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {gig.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {gig.category}
          {gig.subcategory ? ` · ${gig.subcategory}` : ''}
        </p>

        <div className="mt-3 flex items-center gap-2 min-w-0">
          {gig.seller_avatar ? (
            <img
              src={gig.seller_avatar}
              alt={gig.seller_name}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {sellerInitial}
            </span>
          )}
          <span className="text-sm text-gray-700 truncate flex items-center gap-1">
            {gig.seller_name}
            <VerifiedBadge verified={gig.seller_verified} size={14} />
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span className="inline-flex items-center gap-1">
            <Star size={14} className="text-yellow-400" fill="currentColor" />
            <span className="font-medium text-gray-800">{rating.toFixed(1)}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} className="text-gray-400" />
            {gig.delivery_days} day{gig.delivery_days !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-auto pt-3 mt-4 border-t border-gray-100 flex items-end justify-between">
          <span className="text-xs text-gray-500">Starting at</span>
          <span className="text-lg font-bold text-gray-900">
            KSh {Number(gig.amount).toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
