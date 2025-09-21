import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import RotatingText from '../ui/RotatingText';

const ModernNavbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'pi pi-home' },
    { path: '/upload', label: 'Upload', icon: 'pi pi-upload' },
    { path: '/files', label: 'Files', icon: 'pi pi-folder-open' },
    { path: '/search', label: 'Search', icon: 'pi pi-search' },
  ];

  const adminItems = [
    { path: '/admin', label: 'Admin', icon: 'pi pi-shield' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-2 left-0 right-0 z-50"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-full shadow-2xl border border-slate-600/20 px-6 sm:px-8 lg:px-10 py-3">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="px-3 py-1 bg-gradient-to-r from-orange to-orange-dark text-white rounded-lg shadow-lg font-semibold text-lg flex items-center">
                <span className="text-white">File</span>
                <div className="w-20 overflow-hidden">
                  <RotatingText
                    texts={['Vault', 'Secure', 'Cloud', 'Storage']}
                    mainClassName="text-white overflow-hidden"
                    staggerFrom="last"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={3000}
                  />
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-white bg-white/10 backdrop-blur-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <i className={item.icon} style={{ fontSize: '1rem' }}></i>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              
              {user?.role === 'admin' && adminItems.map((item) => {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-white bg-white/10 backdrop-blur-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <i className={item.icon} style={{ fontSize: '1rem' }}></i>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.username || 'User'}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  <AvatarImage src="" alt={user?.username} />
                  <AvatarFallback className="bg-gradient-to-br from-orange to-orange-dark text-white font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Mobile User Info */}
              <div className="md:hidden flex items-center space-x-2">
                <Avatar className="h-8 w-8 border border-white/20">
                  <AvatarImage src="" alt={user?.username} />
                  <AvatarFallback className="bg-gradient-to-br from-orange to-orange-dark text-white text-sm">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-white">{user?.username || 'User'}</span>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-slate-300 hover:text-white hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <i className="pi pi-times" style={{ fontSize: '1.25rem' }}></i> : <i className="pi pi-bars" style={{ fontSize: '1.25rem' }}></i>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-slate-800 border border-slate-600/20 rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-2 fixed top-20 left-0 right-0 z-40"
          >
            <div className="px-6 py-4 space-y-2">
              {navigationItems.map((item) => {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-white bg-white/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className={item.icon} style={{ fontSize: '1.25rem' }}></i>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {user?.role === 'admin' && adminItems.map((item) => {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-white bg-white/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className={item.icon} style={{ fontSize: '1.25rem' }}></i>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default ModernNavbar;