import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBadge from '../Notifications/NotificationBadge';
import { useState } from 'react';

interface NavbarProps {
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  rightContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  hideDefaultAuth?: boolean; // Hide notification badge, profile link, logout by default
}

export default function Navbar({ 
  showBackButton = false, 
  backTo, 
  backLabel = 'Back', 
  rightContent,
  centerContent,
  hideDefaultAuth = false
}: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Logo should go to dashboard if logged in, home if not
  const logoLink = isAuthenticated ? '/dashboard' : '/';

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to={logoLink} className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
            Project Athlete v2
          </Link>
          {centerContent && (
            <div className="flex-1 flex justify-center">
              {centerContent}
            </div>
          )}
          <div className="flex items-center gap-2 md:gap-4">
            {showBackButton && (
              <Link to={backTo || '#'} className="px-3 md:px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors text-sm md:text-base">
                ← <span className="hidden sm:inline">{backLabel}</span>
              </Link>
            )}
            {rightContent || (
              <>
                {isAuthenticated && !hideDefaultAuth && (
                  <>
                    <NotificationBadge />
                    <Link to="/profile" className="hidden md:block text-gray-700 hover:text-blue-600 transition-colors text-sm">
                      {user?.displayName || user?.email}
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="px-3 md:px-4 py-2 text-gray-700 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                    >
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

