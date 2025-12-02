import { useAuth } from '../contexts/AuthContext';

export function useRoles() {
  const { user } = useAuth();

  return {
    isAdmin: user?.role === 'ADMIN',
    isCoach: user?.role === 'COACH' || user?.role === 'ADMIN',
    isUser: user?.role === 'USER',
    role: user?.role,
  };
}

