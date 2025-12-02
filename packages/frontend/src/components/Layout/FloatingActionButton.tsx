import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface QuickAction {
  label: string;
  icon: string;
  path: string;
  onClick?: () => void;
}

export default function FloatingActionButton() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) return null;

  // Get current challenge ID if on challenge detail page
  const challengeId = location.pathname.match(/\/challenges\/([^\/]+)/)?.[1];

  // Define quick actions based on current page
  const quickActions: QuickAction[] = [
    ...(challengeId
      ? [
          {
            label: 'Log Entry',
            icon: '🏆',
            path: `/challenges/${challengeId}`,
            onClick: () => {
              // Scroll to top where the log entry button/form is
              window.scrollTo({ top: 0, behavior: 'smooth' });
            },
          },
        ]
      : [
          {
            label: 'View Challenges',
            icon: '🏆',
            path: '/challenges',
          },
        ]),
    {
      label: 'Log Weight',
      icon: '📊',
      path: '/weight-logs/new',
    },
    {
      label: 'Create Post',
      icon: '✍️',
      path: '/feed/new',
    },
    {
      label: 'New Workout',
      icon: '💪',
      path: '/workouts/new',
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      {/* Action Menu */}
      {isOpen && (
        <div className="mb-3 md:mb-4 space-y-2 animate-fade-in">
          {quickActions.map((action, index) => (
            <Link
              key={action.path}
              to={action.path}
              onClick={() => {
                setIsOpen(false);
                action.onClick?.();
              }}
              className="flex items-center gap-2 md:gap-3 bg-white/90 backdrop-blur-md rounded-full px-4 md:px-6 py-2.5 md:py-3 shadow-lg hover:shadow-xl transition-all border border-gray-200/50 min-w-[180px] md:min-w-[200px] touch-manipulation"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-xl md:text-2xl">{action.icon}</span>
              <span className="font-semibold text-sm md:text-base text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center touch-manipulation ${
          isOpen ? 'rotate-45' : ''
        }`}
        aria-label="Quick Actions"
      >
        <span className="text-xl md:text-2xl">{isOpen ? '✕' : '+'}</span>
      </button>
    </div>
  );
}

