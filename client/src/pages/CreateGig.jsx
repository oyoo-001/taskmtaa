import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  ImagePlus,
  Info,
  Loader2,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import api from '../lib/api';
import { GIG_CATEGORY_GROUPS, getGigSubcategories } from '../lib/gigCategories';
import { useAuth } from '../contexts/AuthContext';

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EMPTY_FORM = {
  title: '',
  category: '',
  subcategory: '',
  description: '',
  notes: '',
  amount: '',
  delivery_days: 3,
};

export default function CreateGig() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageError, setImageError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['gig', id],
    queryFn: async () => {
      const { data } = await api.get(`/gigs/${id}`);
      return data.data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (!isEditing || !existing?.gig) return;
    const { gig } = existing;
    setForm({
      title: gig.title || '',
      category: gig.category || '',
      subcategory: gig.subcategory || '',
      description: gig.description || '',
      notes: gig.notes || '',
      amount: gig.amount ?? '',
      delivery_days: gig.delivery_days ?? 3,
    });

    const urls = Array.isArray(gig.image_urls) ? gig.image_urls : [];
    const thumbnails = Array.isArray(gig.image_thumbnails) ? gig.image_thumbnails : [];
    setImages(
      urls.filter(Boolean).map((url, index) => ({
        url,
        thumbnail_url: thumbnails[index] || url,
        public_id: null,
      }))
    );
  }, [isEditing, existing]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleImageSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';

    if (selectedFiles.length === 0) return;

    setImageError('');
    const remaining = MAX_IMAGES - images.length;

    if (remaining <= 0) {
      setImageError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    const files = selectedFiles.slice(0, remaining);

    if (files.some((file) => !file.type.startsWith('image/'))) {
      setImageError('Only image files are allowed (JPG, PNG, GIF or WebP).');
      return;
    }

    if (files.some((file) => file.size > MAX_IMAGE_BYTES)) {
      setImageError('Each image must be 5 MB or smaller.');
      return;
    }

    try {
      setUploadingImages(true);
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));

      const { data } = await api.post('/uploads/gig-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImages((previous) =>
        [...previous, ...(data.data.images || [])].slice(0, MAX_IMAGES)
      );

      if (files.length < selectedFiles.length) {
        setImageError(
          `Only ${MAX_IMAGES} images are allowed, so extra files were skipped.`
        );
      }
    } catch (err) {
      setImageError(
        err.response?.data?.error?.message ||
          'Could not upload the images. Please try again.'
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setImages((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    setImageError('');
  };

  const makeCoverImage = (index) => {
    setImages((previous) => {
      const next = [...previous];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
  };

  const validationError = useMemo(() => {
    if (form.title.trim().length < 5) return 'Title must be at least 5 characters.';
    if (!form.category) return 'Choose a category for your gig.';
    if (!form.subcategory) return 'Choose the subcategory that best matches your service.';
    if (form.description.trim().length < 20) return 'Description must be at least 20 characters.';
    if (!(Number(form.amount) > 0)) return 'Enter an amount greater than zero.';
    const days = Number(form.delivery_days);
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      return 'Delivery time must be between 1 and 90 days.';
    }
    return null;
  }, [form]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        subcategory: form.subcategory,
        description: form.description.trim(),
        notes: form.notes.trim(),
        amount: Number(form.amount),
        delivery_days: Number(form.delivery_days),
        image_urls: images.map((image) => image.url),
        image_thumbnails: images.map((image) => image.thumbnail_url || image.url),
        thumbnail_url: images[0]?.thumbnail_url || images[0]?.url || null,
      };

      if (isEditing) {
        const { data } = await api.patch(`/gigs/${id}`, payload);
        return data.data.gig;
      }

      const { data } = await api.post('/gigs', payload);
      return data.data.gig;
    },
    onSuccess: (gig) => {
      queryClient.invalidateQueries({ queryKey: ['gigs'] });
      queryClient.invalidateQueries({ queryKey: ['my-gigs'] });
      queryClient.invalidateQueries({ queryKey: ['gig', String(gig.id)] });
      setSuccess(isEditing ? 'Gig updated successfully!' : 'Gig published successfully!');
      setTimeout(() => navigate(`/gigs/${gig.id}`), 700);
    },
    onError: (err) => {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Could not save the gig. Please try again.'
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (uploadingImages) {
      setError('Please wait for your images to finish uploading.');
      return;
    }
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    mutation.mutate();
  };

  if (isEditing && loadingExisting) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const previewSeller = user?.full_name || 'Your name';
  const availableSubcategories = getGigSubcategories(form.category);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to={isEditing ? '/my-gigs' : '/gigs'}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft size={16} />
          {isEditing ? 'Back to my gigs' : 'Back to gigs'}
        </Link>

        <div className="mt-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={26} className="text-primary-600" />
            {isEditing ? 'Edit your gig' : 'Publish a new gig'}
          </h1>
          <p className="mt-1 text-gray-600">
            Describe what you can do, set your price, and start receiving requests from buyers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-7 space-y-7"
          >
            {/* Overview */}
            <section>
              <SectionHeading step="1" title="Overview" subtitle="Give buyers a clear idea of your service." />

              <label className="block mt-4">
                <span className="text-sm font-medium text-gray-700">Gig title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value.slice(0, 120))}
                  placeholder="I will deep clean your house or office"
                  maxLength={120}
                  className="input mt-1"
                  required
                />
                <span className="mt-1 block text-right text-xs text-gray-400">
                  {form.title.length}/120
                </span>
              </label>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Category</span>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      update('category', e.target.value);
                      update('subcategory', '');
                    }}
                    className="input mt-1"
                    required
                  >
                    <option value="">Select a category</option>
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
                  <span className="text-sm font-medium text-gray-700">Subcategory</span>
                  <select
                    value={form.subcategory}
                    onChange={(e) => update('subcategory', e.target.value)}
                    disabled={!form.category}
                    className="input mt-1 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    required
                  >
                    <option value="">
                      {form.category ? 'Select a subcategory' : 'Choose a category first'}
                    </option>
                    {availableSubcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Pick the closest subcategory — buyers filter by it, so being specific gets you more views.
              </p>
            </section>

            {/* Description */}
            <section className="pt-5 border-t border-gray-100">
              <SectionHeading
                step="2"
                title="Description"
                subtitle="Explain what you will do, how you work, and anything buyers should know."
              />

              <label className="block mt-4">
                <span className="text-sm font-medium text-gray-700">Describe your service</span>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value.slice(0, 5000))}
                  rows={7}
                  placeholder="Tell buyers about your experience, what is included, and what makes your service stand out..."
                  className="input mt-1 resize-y"
                  required
                />
                <span className="mt-1 block text-xs text-gray-400">
                  Minimum 20 characters. {form.description.length}/5000
                </span>
              </label>

              <label className="block mt-3">
                <span className="text-sm font-medium text-gray-700">
                  Notes / requirements <span className="font-normal text-gray-400">(optional)</span>
                </span>
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value.slice(0, 2000))}
                  rows={3}
                  placeholder="e.g. Buyer should share their address and preferred time. Bring your own cleaning supplies."
                  className="input mt-1 resize-y"
                />
                <span className="mt-1 block text-xs text-gray-400">
                  Helpful details buyers should provide or know before ordering.
                </span>
              </label>
            </section>

            {/* Gallery */}
            <section className="pt-5 border-t border-gray-100">
              <SectionHeading
                step="3"
                title="Gallery"
                subtitle="Show buyers what you offer. The first image becomes your cover."
              />

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((image, index) => (
                  <div
                    key={image.public_id || image.url}
                    className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                  >
                    <img
                      src={image.thumbnail_url || image.url}
                      alt={`Gig preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-2 py-1.5">
                      {index > 0 ? (
                        <button
                          type="button"
                          onClick={() => makeCoverImage(index)}
                          className="text-[11px] font-medium text-white hover:underline"
                        >
                          Make cover
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-white/80">
                          Cover image
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                        className="rounded p-1 text-white hover:bg-white/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {images.length < MAX_IMAGES && (
                  <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center transition-colors hover:border-primary-400 hover:bg-primary-50">
                    {uploadingImages ? (
                      <Loader2 size={22} className="animate-spin text-primary-600" />
                    ) : (
                      <ImagePlus size={22} className="text-gray-400" />
                    )}
                    <span className="mt-1 text-xs font-medium text-gray-600">
                      {uploadingImages ? 'Uploading...' : 'Add photos'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      JPG, PNG or WebP · 5 MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={uploadingImages}
                    />
                  </label>
                )}
              </div>

              <p className="mt-2 text-xs text-gray-400">
                {images.length}/{MAX_IMAGES} images added. Images are stored on
                Cloudinary and thumbnails are generated automatically.
              </p>
              {imageError && (
                <p className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {imageError}
                </p>
              )}
            </section>

            {/* Pricing */}
            <section className="pt-5 border-t border-gray-100">
              <SectionHeading
                step="4"
                title="Pricing & delivery"
                subtitle="Set a starting price and how long the work usually takes."
              />

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Amount (KSh)</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.amount}
                    onChange={(e) => update('amount', e.target.value)}
                    placeholder="2500"
                    className="input mt-1"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Delivery time (days)</span>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    step="1"
                    value={form.delivery_days}
                    onChange={(e) => update('delivery_days', e.target.value)}
                    className="input mt-1"
                    required
                  />
                </label>
              </div>
            </section>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={mutation.isPending || uploadingImages || Boolean(validationError)}
                className="btn-primary px-6 py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadingImages
                  ? 'Uploading images...'
                  : mutation.isPending
                    ? 'Saving...'
                    : isEditing
                      ? 'Save changes'
                      : 'Publish gig'}
              </button>
              <Link
                to={isEditing ? '/my-gigs' : '/gigs'}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>

            {validationError && (
              <p className="flex items-start gap-2 text-xs text-gray-500">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                {validationError}
              </p>
            )}
          </form>

          {/* Live preview */}
          <aside className="lg:sticky lg:top-20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Live preview
            </p>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 relative">
                {images[0] ? (
                  <>
                    <img
                      src={images[0].thumbnail_url || images[0].url}
                      alt="Cover preview"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-black/10" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl font-bold text-white/25 select-none">
                      {previewSeller.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-primary-700">
                  {form.subcategory || form.category || 'Category'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {form.title || 'Your gig title will appear here'}
                </h3>
                <div className="mt-3 flex items-center gap-2">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={previewSeller}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                      {previewSeller.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm text-gray-700 truncate flex items-center gap-1">
                    {previewSeller}
                    <BadgeCheck size={14} className="text-primary-600" />
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Star size={14} className="text-yellow-400" fill="currentColor" />
                    {Number(user?.rating || 5).toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} className="text-gray-400" />
                    {form.delivery_days || 3} days
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">Starting at</span>
                  <span className="text-lg font-bold text-gray-900">
                    KSh {Number(form.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-primary-50 border border-primary-100 p-4 text-sm text-primary-800">
              <p className="font-medium">Tips for a strong gig</p>
              <ul className="mt-2 space-y-1 text-primary-700 list-disc list-inside">
                <li>Be specific about what is included.</li>
                <li>Add clear photos of your work or service.</li>
                <li>Show your experience and results.</li>
                <li>Set a realistic delivery time.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ step, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
        {step}
      </span>
      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}
