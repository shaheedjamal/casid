import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert } from 'lucide-react';
import { CasidLogo } from '../../components/CasidLogo';
import { useAuth } from '../../hooks/useAuth';
import { extractApiError } from '../../services/api';

export function AdminLoginPage() {
  const { user, loading, needsInitialSetup, designatedEmail, login, setupInitialAdmin } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [name, setName] = useState('Shaheed');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (needsInitialSetup) {
      setMode('setup');
      setEmail(designatedEmail);
    } else {
      setMode('login');
    }
  }, [needsInitialSetup, designatedEmail]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(extractApiError(err, 'Authentication failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInitialSetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Please enter the administrator full name.');
      return;
    }
    if (email.trim().toLowerCase() !== designatedEmail.toLowerCase()) {
      setError(`Only the designated initial administrator (${designatedEmail}) can complete setup.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await setupInitialAdmin(name.trim(), email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(extractApiError(err, 'Initial administrator setup failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-md">
            <CasidLogo />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              {mode === 'setup' ? 'Initial Super Admin Provisioning' : 'Administrator Sign In'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {mode === 'setup'
                ? 'One-time secure activation for the designated Casid Pharma Super Administrator.'
                : 'Authorized personnel portal for website and content maintenance.'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-5">
          {needsInitialSetup && mode === 'setup' && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>First-Time Setup Required</span>
              </div>
              <p>
                No active Super Admin exists yet. Set a strong password for{' '}
                <span className="font-mono font-medium">{designatedEmail}</span>. This setup locks permanently once
                completed.
              </p>
            </div>
          )}

          {error && (
            <div role="alert" className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-md">
              {error}
            </div>
          )}

          {mode === 'setup' ? (
            <form onSubmit={handleInitialSetup} className="space-y-4" noValidate>
              <div>
                <label htmlFor="setup-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Administrator Full Name
                </label>
                <input
                  id="setup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
              <div>
                <label htmlFor="setup-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Designated Super Admin Email
                </label>
                <input
                  id="setup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
              <div>
                <label htmlFor="setup-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Create Strong Password
                </label>
                <input
                  id="setup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Min 8 chars, upper, lower, number, symbol"
                />
              </div>
              <div>
                <label htmlFor="setup-confirm" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="setup-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 disabled:opacity-60 rounded-md transition-colors"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>{submitting ? 'Provisioning Super Admin...' : 'Activate Super Admin Account'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Administrator Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="shaheed@gmail.com"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 disabled:opacity-60 rounded-md transition-colors"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>{submitting ? 'Verifying Credentials...' : 'Sign In to Maintenance Portal'}</span>
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs font-medium text-slate-600 hover:text-slate-900">
            ← Return to Casid Pharma Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
