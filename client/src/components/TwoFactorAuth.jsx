import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function TwoFactorAuth() {
  const [status, setStatus] = useState({ enabled: false, unusedBackupCodes: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Setup state
  const [setupStep, setSetupStep] = useState('idle'); // idle, qr, verify
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  
  // Disable state
  const [password, setPassword] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/auth/2fa/status');
      setStatus(response.data.data);
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
    }
  };

  const handleSetup = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/2fa/setup');
      setQrCode(response.data.data.qrCode);
      setSecret(response.data.data.secret);
      setSetupStep('qr');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/2fa/verify', {
        code: verificationCode
      });
      
      setBackupCodes(response.data.data.backupCodes);
      setSetupStep('verify');
      setSuccess('2FA enabled successfully! Save your backup codes.');
      await fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/2fa/disable', { password });
      setSuccess('2FA disabled successfully');
      setShowDisableConfirm(false);
      setPassword('');
      await fetchStatus();
      setSetupStep('idle');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setSetupStep('idle');
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    setBackupCodes([]);
    setError('');
    setSuccess('');
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    alert('Backup codes copied to clipboard!');
  };

  if (setupStep === 'qr') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Setup Two-Factor Authentication</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Step 1: Scan QR Code</h3>
            <p className="text-gray-600 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            
            {qrCode && (
              <div className="flex justify-center mb-4">
                <img src={qrCode} alt="2FA QR Code" className="w-64 h-64 border-2 border-gray-300 rounded-lg" />
              </div>
            )}

            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                Can't scan? Enter code manually
              </summary>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">Secret Key:</p>
                <code className="block p-2 bg-white border border-gray-300 rounded text-sm break-all">
                  {secret}
                </code>
              </div>
            </details>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Step 2: Verify Code</h3>
              <p className="text-gray-600 mb-4">
                Enter the 6-digit code from your authenticator app
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                disabled={loading}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSetupStep('idle')}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (setupStep === 'verify' && backupCodes.length > 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Save Your Backup Codes</h2>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800 font-semibold mb-2">⚠️ Important!</p>
            <p className="text-yellow-700 text-sm">
              Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device. Each code can only be used once.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Backup Codes</h3>
              <button
                onClick={copyBackupCodes}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                📋 Copy All
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <code key={index} className="block p-2 bg-white border border-gray-300 rounded text-sm text-center">
                  {code}
                </code>
              ))}
            </div>
          </div>

          <button
            onClick={handleDone}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Two-Factor Authentication</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">Status</h3>
            <p className="text-gray-600 mt-1">
              {status.enabled ? (
                <span className="inline-flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  2FA Enabled
                </span>
              ) : (
                <span className="inline-flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  2FA Disabled
                </span>
              )}
            </p>
            {status.enabled && (
              <p className="text-sm text-gray-500 mt-2">
                {status.unusedBackupCodes} unused backup codes remaining
              </p>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-blue-800 text-sm">
            🔒 Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
          </p>
        </div>

        {!status.enabled ? (
          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up...' : 'Enable 2FA'}
          </button>
        ) : (
          <>
            {!showDisableConfirm ? (
              <button
                onClick={() => setShowDisableConfirm(true)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium"
              >
                Disable 2FA
              </button>
            ) : (
              <form onSubmit={handleDisable} className="space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-red-800 text-sm font-semibold mb-2">
                    Are you sure you want to disable 2FA?
                  </p>
                  <p className="text-red-700 text-sm">
                    Your account will be less secure without two-factor authentication.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Your password"
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisableConfirm(false);
                      setPassword('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Disabling...' : 'Confirm Disable'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
