import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white/10 backdrop-blur-sm shadow-sm border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white drop-shadow-lg">FileVault</h1>
            </Link>
            {user && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/dashboard"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 hover:bg-white/10"
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 hover:bg-white/10"
                >
                  Upload
                </Link>
                <Link
                  to="/files"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 hover:bg-white/10"
                >
                  Files
                </Link>
                <Link
                  to="/search"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 hover:bg-white/10"
                >
                  Search
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 hover:bg-white/10"
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
                <span className="text-sm text-white/80 drop-shadow-sm">
                  Welcome, {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500/80 backdrop-blur-sm hover:bg-red-600/80 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 border border-red-400/30 shadow-lg"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 border border-white/30 shadow-lg"
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








