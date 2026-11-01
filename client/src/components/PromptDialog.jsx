import { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';

/**
 * Reusable prompt dialog component for text input
 * 
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {function} onClose - Callback when dialog is closed/cancelled
 * @param {function} onSubmit - Callback when input is submitted with value
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message/description
 * @param {string} placeholder - Input placeholder text
 * @param {string} defaultValue - Default input value
 * @param {string} submitText - Text for submit button (default: "Submit")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {boolean} required - Whether input is required
 * @param {string} inputType - Input type: 'text', 'textarea' (default: 'text')
 * @param {boolean} loading - Whether submit action is in progress
 */
export default function PromptDialog({
  isOpen,
  onClose,
  onSubmit,
  title = 'Input Required',
  message = 'Please enter your input:',
  placeholder = 'Enter text here...',
  defaultValue = '',
  submitText = 'Submit',
  cancelText = 'Cancel',
  required = true,
  inputType = 'text',
  loading = false
}) {
  const [value, setValue] = useState(defaultValue);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (required && !value.trim()) return;
    onSubmit(value.trim());
  };

  const handleClose = () => {
    setValue(defaultValue);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100">
                <MessageSquare size={24} className="text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            {message && <p className="text-gray-700 leading-relaxed">{message}</p>}
            
            {inputType === 'textarea' ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={loading}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoFocus
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={loading || (required && !value.trim())}
              className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                submitText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
