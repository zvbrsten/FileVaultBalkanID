import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RotatingText from '../components/ui/RotatingText';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* FileVault Logo */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange to-orange-dark text-white rounded-lg shadow-lg font-semibold text-2xl">
            <span className="text-white">File</span>
            <div className="w-20 overflow-hidden">
              <RotatingText
                texts={['Vault', 'Secure', 'Cloud', 'Storage']}
                mainClassName="text-white overflow-hidden"
                staggerFrom="last"
                staggerDuration={0.05}
                rotationInterval={2000}
              />
            </div>
          </div>
        </div>
        
        <div className="max-w-sm w-full space-y-6">
          <div>
            <h2 className="mt-6 text-center text-2xl font-medium text-cream-800">
              Sign in to your account
            </h2>
          <p className="mt-2 text-center text-sm text-cream-700">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium text-forest-green hover:text-forest-green-hover"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="theme-input w-full"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="theme-input w-full"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="theme-button w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;


















