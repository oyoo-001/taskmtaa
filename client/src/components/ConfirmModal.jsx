import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Reusable confirmation modal component
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {function} props.onClose - Called when modal is closed
 * @param {function} props.onConfirm - Called when user confirms action
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message/description
 * @param {string} props.confirmText - Text for confirm button (default: "Confirm")
 * @param {string} props.cancelText - Text for cancel button (default: "Cancel")
 * @param {string} props.type - Modal type: 'danger', 'warning', 'success', 'info' (default: 'warning')
 * @param {boolean} props.loading - Shows loading state on confirm button
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false
}) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    success: {
      icon: CheckCircleIcon,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    },
    info: {
      icon: InformationCircleIcon,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  };

  const config = typeConfig[type] || typeConfig.warning;
  const Icon = config.icon;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl transform transition-all">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700
              hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
              ${config.buttonColor}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
