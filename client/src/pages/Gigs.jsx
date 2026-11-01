import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Sparkles, PlusCircle } from 'lucide-react';
import api from '../lib/api';
import GigCard from '../components/GigCard';
import {
  GIG_CATEGORY_GROUPS,
  GIG_SORT_OPTIONS,
  getGigSubcategories,
} from '../lib/gigCategories';
import { useAuth } from '../contexts/AuthContext';

export default function Gigs() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [subcategory, setSubcategory] = useState('All');
  const [sort, setSort] = useState('newest');

  // Debounce typing so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setQ(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['gigs', user?.id ?? 'guest', q, category, subcategory, sort],
    queryFn: async () => {
      const { data } = await api.get('/gigs', {
        params: {
          q: q || undefined,
          category: category !== 'All' ? category : undefined,
          subcategory: subcategory !== 'All' ? subcategory : undefined,
          sort,
        },
      });
      return data.data;
    },
  });

  const fetchedGigs = data?.gigs || [];
  // Belt-and-braces: the API already excludes the viewer's own gigs,
  // but never render them even if a cached response slips through.
  const gigs = user
    ? fetchedGigs.filter((gig) => gig.seller_id !== user.id)
    : fetchedGigs;
  const totalGigs = Math.max(
    0,
    (data?.total ?? fetchedGigs.length) - (fetchedGigs.length - gigs.length)
  );
  const subcategories = category === 'All' ? [] : getGigSubcategories(category);
  const hasFilters = q !== '' || category !== 'All' || subcategory !== 'All';

  const handleCategoryChange = (value) => {
    setCategory(value);
    setSubcategory('All');
  };

  const clearFilters = () => {
    setSearchInput('');
    setQ('');
    setCategory('All');
    setSubcategory('All');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* Header / search */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                <Sparkles size={14} />
                Gigs
              </span>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
                Hire local talent for anything
              </h1>
              <p className="mt-2 text-primary-100">
                From cleaning and construction to tech, design and office support —
                find the exact service you need.
              </p>
            </div>

            <Link
              to={user ? '/gigs/create' : '/login'}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-primary-700 shadow-lg hover:bg-primary-50 transition-colors"
            >
              <PlusCircle size={20} />
              Offer a Gig
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search gigs, e.g. cleaning, plumbing, web design, data entry..."
                className="w-full rounded-lg border border-transparent bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/70"
                aria-label="Search gigs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary-100">
                  Category
                </span>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  aria-label="Filter by category"
                  className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/70"
                >
                  <option value="All">All categories</option>
                  {GIG_CATEGORY_GROUPS.map(({ group, categories }) => (
                    <optgroup key={group} label={group}>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary-100">
                  Subcategory
                </span>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  disabled={category === 'All'}
                  aria-label="Filter by subcategory"
                  className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/70 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="All">
                    {category === 'All' ? 'Choose a category first' : 'All subcategories'}
                  </option>
                  {subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary-100">
                  Sort by
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort gigs"
                  className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/70"
                >
                  {GIG_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Results summary */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600">
            {isLoading ? (
              'Finding gigs...'
            ) : (
              <>
                <span className="font-semibold text-gray-900">{totalGigs}</span>{' '}
                {totalGigs === 1 ? 'gig' : 'gigs'}
                {q ? ` matching "${q}"` : ''}
                {category !== 'All' ? ` in ${category}` : ''}
                {subcategory !== 'All' ? ` · ${subcategory}` : ''}
              </>
            )}
          </p>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-primary-700 hover:text-primary-800"
              >
                Clear filters
              </button>
            )}
            {isFetching && !isLoading && (
              <span className="text-xs text-gray-400">Updating...</span>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-red-700">
            Failed to load gigs. Please try again.
          </div>
        )}

        {!isLoading && !error && gigs.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <Sparkles size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg text-gray-500">
              {hasFilters ? 'No gigs match these filters' : 'No gigs found'}
            </p>
            <p className="mx-auto mt-1 max-w-lg text-gray-400">
              {hasFilters
                ? 'Try a different category, subcategory or search term.'
                : user
                  ? "Your own gigs are hidden here so you can discover other sellers. Manage your listings from My Gigs."
                  : 'Be the first person to offer a service here.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear filters
                </button>
              )}
              {user && (
                <Link
                  to="/my-gigs"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  My Gigs
                </Link>
              )}
              <Link
                to={user ? '/gigs/create' : '/login'}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2 font-semibold"
              >
                <PlusCircle size={18} />
                Offer a Gig
              </Link>
            </div>
          </div>
        )}

        {!isLoading && !error && gigs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
