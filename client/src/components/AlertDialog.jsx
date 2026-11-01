import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

/**
 * Reusable alert/notification dialog component
 * 
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {function} onClose - Callback when dialog is closed
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message/description
 * @param {string} buttonText - Text for close button (default: "OK")
 * @param {string} variant - Dialog variant: 'success', 'error', 'warning', 'info' (default: 'info')
 */
export default function AlertDialog({
  isOpen,
  onClose,
  title = 'Alert',
  message = '',
  buttonText = 'OK',
  variant = 'info'
}) {
  if (!isOpen) return null;

  const variants = {
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      borderColor: 'border-green-200'
    },
    error: {
      icon: XCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      borderColor: 'border-red-200'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
      borderColor: 'border-yellow-200'
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-primary-600 hover:bg-primary-700',
      borderColor: 'border-blue-200'
    }
  };

  const config = variants[variant] || variants.info;
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-w-md border-2 ${config.borderColor} transform transition-all animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.iconBg}`}>
              <Icon size={24} className={config.iconColor} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Close alert"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${config.buttonBg}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
