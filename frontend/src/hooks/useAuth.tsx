import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('metrisure_token');
    const storedUser = localStorage.getItem('metrisure_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user, clearing localStorage:', e);
        localStorage.removeItem('metrisure_token');
        localStorage.removeItem('metrisure_user');
      }
    }

    if (storedToken) {
      apiClient.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('metrisure_user', JSON.stringify(res.data));
        })
        .catch((e) => {
          console.warn('Could not sync /auth/me:', e);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      // Use real FastAPI backend
      const response = await apiClient.post('/auth/login', { 
        email, 
        password: password || 'demo123' // fallback for demo UI if password field is missing
      });
      
      const { access_token, user: apiUser } = response.data;
      
      setToken(access_token);
      setUser(apiUser);
      localStorage.setItem('metrisure_token', access_token);
      localStorage.setItem('metrisure_user', JSON.stringify(apiUser));
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('metrisure_token');
    localStorage.removeItem('metrisure_user');
  };

  const hasRole = (role: UserRole) => user?.role === role;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
