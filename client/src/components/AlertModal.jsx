import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

/**
 * Reusable alert/notification modal component (replacement for browser alert())
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {function} props.onClose - Called when modal is closed
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message/description
 * @param {string} props.buttonText - Text for OK button (default: "OK")
 * @param {string} props.type - Modal type: 'error', 'warning', 'success', 'info' (default: 'info')
 */
export default function AlertModal({
  isOpen,
  onClose,
  title = 'Notification',
  message = '',
  buttonText = 'OK',
  type = 'info'
}) {
  if (!isOpen) return null;

  const typeConfig = {
    error: {
      icon: XCircleIcon,
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

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl transform transition-all animate-fadeIn">
        <div className="flex items-start gap-4 mb-6">
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
            className="flex-shrink-0 text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            autoFocus
            className={`px-6 py-2 text-white rounded-lg font-medium
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
              ${config.buttonColor}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
