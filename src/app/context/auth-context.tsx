"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { User, UserType } from '@/types/user';
import { apiService } from '@/services/api-service';

interface AuthContextProps {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  userType: UserType | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  // Fetch user data after authentication
  const fetchUserData = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData.data);
      setUserType(userData.data.user_type as UserType);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
      setUserType(null);
    }
  };

  // Check auth status on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('accessToken');
      const storedEmail = localStorage.getItem("userEmail");
      
      if (token) {
        setIsAuthenticated(true);
        await fetchUserData();
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setUserType(null);
        
        // Redirect to login if trying to access protected routes
        if (!pathname.startsWith('/auth') && !pathname.startsWith('/_next')) {
          router.push('/auth/sign-in');
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [pathname, router]);

  // Login function
  const login = async (token: string, email: string) => {
    Cookies.set('accessToken', token, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    localStorage.setItem("userEmail", email);
    setIsAuthenticated(true);
    
    // Fetch user data after successful login
    await fetchUserData();
    
    // Redirect based on user type
    if (userType === UserType.PLAYER) {
      router.push('/player/dashboard');
    } else if (userType === UserType.MANAGER) {
      router.push('/manager/dashboard');
    } else {
      router.push('/');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      Cookies.remove('accessToken');
      localStorage.removeItem("userEmail");
      setIsAuthenticated(false);
      setUser(null);
      setUserType(null);
      router.push('/auth/sign-in');
    }
  };

  // Function to refresh user data
  const refreshUserData = async () => {
    if (isAuthenticated) {
      await fetchUserData();
    }
  };

  const value = {
    isAuthenticated,
    loading,
    user,
    userType,
    login,
    logout,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}