import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logo } from '../lib/assets';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user wanted to visit before login
  const from = location.state?.from?.pathname || '/';
  const returnMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, twoFactorCode);
      
      // Check if 2FA is required
      if (result?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setError('');
      } else {
        // Redirect to the page they wanted to visit
        navigate(from, { replace: true });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      
      // If account is locked, don't show 2FA input
      if (errorMsg.includes('locked') || errorMsg.includes('suspended')) {
        setRequiresTwoFactor(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/" className="block w-fit mx-auto" aria-label="TaskMtaa home">
            <img
              src={logo}
              alt="TaskMtaa logo"
              className="h-24 w-24 rounded-2xl object-cover shadow-md"
            />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to TaskMtaa
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link 
              to="/register" 
              state={{ from: location.state?.from, message: returnMessage }}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        {returnMessage && (
          <div className="bg-blue-50 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <p className="text-sm">{returnMessage}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {requiresTwoFactor && (
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Two-Factor Code
                </label>
                <input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  maxLength={6}
                  required={requiresTwoFactor}
                  className="input text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit code from your authenticator app or use a backup code
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
