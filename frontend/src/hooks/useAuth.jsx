import { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken, getCurrentUser } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      console.log('[Auth] Loading user data...');
      const userData = await getCurrentUser();
      console.log('[Auth] User loaded:', userData);
      setUser(userData);
    } catch (error) {
      console.error('[Auth] Failed to load user:', error);
      // Token is invalid, clear it
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token) => {
    console.log('[Auth] Logging in with token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    setAuthToken(token);
    await loadUser();
  };

  const logout = () => {
    console.log('[Auth] Logging out');
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
