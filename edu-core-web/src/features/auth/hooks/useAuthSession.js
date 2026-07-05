import { useAuth } from '../AuthContext';

export const useAuthSession = () => {
  const { user, accessToken, isAuthenticated, isLoading, login, logout } =
    useAuth();

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isReceptionist: user?.role === 'RECEPTIONIST',
    isTeacher: user?.role === 'TEACHER',
    isAccountant: user?.role === 'ACCOUNTANT',
  };
};
