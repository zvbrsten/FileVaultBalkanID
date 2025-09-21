import React, { useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import RotatingText from '../ui/RotatingText';

// TypeScript interfaces for better type safety
interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

interface ModernNavbarProps {
  className?: string;
}

const ModernNavbar: React.FC<ModernNavbarProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Memoized navigation items for better performance
  const navigationItems: NavigationItem[] = useMemo(() => [
    { path: '/dashboard', label: 'Dashboard', icon: 'pi pi-home', requiresAuth: true },
    { path: '/upload', label: 'Upload', icon: 'pi pi-upload', requiresAuth: true },
    { path: '/files', label: 'Files', icon: 'pi pi-folder-open', requiresAuth: true },
    { path: '/search', label: 'Search', icon: 'pi pi-search', requiresAuth: true },
  ], []);

  const adminItems: NavigationItem[] = useMemo(() => [
    { path: '/admin', label: 'Admin', icon: 'pi pi-shield', requiresAuth: true, adminOnly: true },
  ], []);

  // Memoized active path check
  const isActive = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  // Enhanced logout with error handling and loading state
  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Could add toast notification here
    } finally {
      setIsLoggingOut(false);
      setIsMobileMenuOpen(false);
    }
  }, [logout, navigate]);

  // Close mobile menu when clicking outside
  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Close mobile menu on escape key
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsMobileMenuOpen(false);
    }
  }, []);

  // Filter navigation items based on user permissions
  const visibleNavigationItems = useMemo(() => {
    if (!user) return [];
    return navigationItems.filter(item => 
      !item.requiresAuth || (item.requiresAuth && user)
    );
  }, [navigationItems, user]);

  const visibleAdminItems = useMemo(() => {
    if (!user || user.role !== 'admin') return [];
    return adminItems.filter(item => 
      !item.requiresAuth || (item.requiresAuth && user)
    );
  }, [adminItems, user]);

  // Reusable navigation item component
  const NavigationItem: React.FC<{ 
    item: NavigationItem; 
    isMobile?: boolean; 
    onItemClick?: () => void;
  }> = ({ item, isMobile = false, onItemClick }) => {
    const active = isActive(item.path);
    
    return (
      <Link
        to={item.path}
        className={`relative px-2 py-1.5 rounded-lg transition-all duration-200 ${
          isMobile 
            ? `flex items-center space-x-2 ${active ? 'text-white bg-white/10' : 'text-slate-200 hover:text-white hover:bg-white/5'}`
            : `${active ? 'text-white bg-white/10 backdrop-blur-sm' : 'text-slate-200 hover:text-white hover:bg-white/5'}`
        }`}
        onClick={onItemClick}
        aria-current={active ? 'page' : undefined}
        role="menuitem"
      >
        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-1.5'}`}>
          <i 
            className={item.icon} 
            style={{ fontSize: isMobile ? '1.25rem' : '0.875rem' }}
            aria-hidden="true"
          ></i>
          <span className={`font-medium ${isMobile ? 'text-sm' : 'text-xs'}`}>
            {item.label}
          </span>
        </div>
        {active && (
          <motion.div
            className="absolute inset-0 bg-white/10 rounded-lg"
            layoutId="activeTab"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </Link>
    );
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-2 left-0 right-0 z-50 ${className}`}
      role="navigation"
      aria-label="Main navigation"
      onKeyDown={handleKeyDown}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-full shadow-2xl border border-slate-600/20 px-4 sm:px-6 lg:px-8 py-3 overflow-hidden">
          <div className="flex items-center justify-between h-16 min-w-0 w-full">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2 mr-4 flex-shrink-0">
              <div className="px-2 py-1 bg-gradient-to-r from-orange to-orange-dark text-white rounded-lg shadow-lg font-semibold text-sm flex items-center">
                <span className="text-white">File</span>
                <div className="w-16 overflow-hidden">
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
            <div className="hidden md:flex items-center space-x-1 flex-1 justify-center min-w-0" role="menubar">
              {visibleNavigationItems.map((item) => (
                <NavigationItem key={item.path} item={item} />
              ))}
              {visibleAdminItems.map((item) => (
                <NavigationItem key={item.path} item={item} />
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* User Info */}
              {user && (
                <div className="hidden md:flex items-center space-x-2">
                  <div className="text-right max-w-20">
                    <p className="text-xs font-medium text-white truncate" title={user.username}>
                      {user.username || 'User'}
                    </p>
                  </div>
                  <Avatar className="h-6 w-6 border border-white/20 flex-shrink-0">
                    <AvatarImage src="" alt={`${user.username}'s avatar`} />
                    <AvatarFallback className="bg-gradient-to-br from-orange to-orange-dark text-white font-semibold text-xs">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={isLoggingOut ? 'Logging out...' : 'Logout'}
                    title={isLoggingOut ? 'Logging out...' : 'Logout'}
                  >
                    {isLoggingOut ? (
                      <i className="pi pi-spin pi-spinner" style={{ fontSize: '0.6rem' }}></i>
                    ) : (
                      <i className="pi pi-sign-out" style={{ fontSize: '0.6rem' }}></i>
                    )}
                  </button>
                </div>
              )}

              {/* Mobile User Info */}
              {user && (
                <div className="md:hidden flex items-center space-x-2">
                  <Avatar className="h-8 w-8 border border-white/20">
                    <AvatarImage src="" alt={`${user.username}'s avatar`} />
                    <AvatarFallback className="bg-gradient-to-br from-orange to-orange-dark text-white text-sm">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white" title={user.username}>
                    {user.username || 'User'}
                  </span>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-slate-200 hover:text-white hover:bg-white/10"
                onClick={handleMobileMenuToggle}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMobileMenuOpen ? (
                  <i className="pi pi-times" style={{ fontSize: '1.25rem' }} aria-hidden="true"></i>
                ) : (
                  <i className="pi pi-bars" style={{ fontSize: '1.25rem' }} aria-hidden="true"></i>
                )}
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
            id="mobile-menu"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <div className="px-6 py-4 space-y-2">
              {visibleNavigationItems.map((item) => (
                <NavigationItem 
                  key={item.path} 
                  item={item} 
                  isMobile={true}
                  onItemClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
              
              {visibleAdminItems.map((item) => (
                <NavigationItem 
                  key={item.path} 
                  item={item} 
                  isMobile={true}
                  onItemClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-200 hover:text-white hover:bg-white/5 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                role="menuitem"
                aria-label="Logout"
              >
                {isLoggingOut ? (
                  <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.25rem' }} aria-hidden="true"></i>
                ) : (
                  <i className="pi pi-sign-out" style={{ fontSize: '1.25rem' }} aria-hidden="true"></i>
                )}
                <span className="font-medium">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default ModernNavbar;