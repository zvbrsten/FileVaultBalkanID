import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar-bg backdrop-blur-sm shadow-sm border-b navbar-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold navbar-text drop-shadow-lg [data-theme='light']:drop-shadow-none">FileVault</h1>
            </Link>
            {user && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                    isActive('/dashboard')
                      ? 'navbar-text navbar-bg shadow-lg'
                      : 'navbar-text-muted navbar-bg-hover'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                    isActive('/upload')
                      ? 'navbar-text navbar-bg shadow-lg'
                      : 'navbar-text-muted navbar-bg-hover'
                  }`}
                >
                  Upload
                </Link>
                <Link
                  to="/files"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                    isActive('/files')
                      ? 'navbar-text navbar-bg shadow-lg'
                      : 'navbar-text-muted navbar-bg-hover'
                  }`}
                >
                  Files
                </Link>
                <Link
                  to="/search"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                    isActive('/search')
                      ? 'navbar-text navbar-bg shadow-lg'
                      : 'navbar-text-muted navbar-bg-hover'
                  }`}
                >
                  Search
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                      isActive('/admin')
                        ? 'navbar-text navbar-bg shadow-lg'
                        : 'navbar-text-muted navbar-bg-hover'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm navbar-text-muted drop-shadow-sm [data-theme='light']:drop-shadow-none">
                  Welcome, {user.username}
                </span>
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="navbar-logout backdrop-blur-sm px-4 py-2 rounded-md text-sm font-medium border shadow-lg"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Link
                  to="/login"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                    isActive('/login')
                      ? 'navbar-text navbar-bg shadow-lg'
                      : 'navbar-text-muted navbar-bg-hover'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="navbar-signup px-4 py-2 rounded-md text-sm font-medium border shadow-lg backdrop-blur-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;











