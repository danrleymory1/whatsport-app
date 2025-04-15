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
    userEmail: string | null;
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
    const [userEmail, setUserEmail] = useState<string | null>(null); // Adicione este estado
    
    const router = useRouter();
    const pathname = usePathname();
  
    // Fetch user data after authentication
    const fetchUserData = async () => {
      try {
        // Only attempt to fetch if we have a token
        const token = Cookies.get('accessToken');
        if (!token) {
          console.log('No token available, skipping user data fetch');
          return;
        }
    
        const userData = await apiService.getCurrentUser();
        
        if (userData && userData.data) {
          setUser(userData.data);
          setUserType(userData.data.user_type as UserType);
          setUserEmail(userData.data.email);
        } else {
          // Handle empty or invalid response
          console.warn('Empty or invalid user data response');
          // Don't throw error, but mark as unauthenticated if needed
          if (!userEmail) {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Don't clear authentication state on fetch error
        // Only clear if token is invalid/expired
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          setIsAuthenticated(false);
          setUser(null);
          setUserType(null);
        }
      }
    };
  
    // Check auth status on initial load
    useEffect(() => {
      const checkAuth = async () => {
        const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
        const storedEmail = localStorage.getItem("userEmail");
        
        setLoading(true);
        
        if (token) {
          try {
            setIsAuthenticated(true);
            setUserEmail(storedEmail);
            await fetchUserData();
          } catch (error) {
            console.error("Error during authentication check:", error);
            // Only redirect to login if we're not already on a login page
            if (!pathname.startsWith('/auth/')) {
              router.push('/auth/sign-in');
            }
          } finally {
            setLoading(false);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setUserType(null);
          setUserEmail(null);
          
          // Only redirect to login if we're not already on a public route
          if (!pathname.startsWith('/auth/') && !pathname.startsWith('/_next')) {
            router.push('/auth/sign-in');
          }
          
          setLoading(false);
        }
      };
      
      checkAuth();
    }, [pathname]);
    
    // Login function
    const login = async (token: string, email: string) => {
      try {
        // Store token in both cookie and localStorage
        Cookies.set('accessToken', token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: 1 // 1 day
        });
        
        localStorage.setItem('accessToken', token);
        localStorage.setItem("userEmail", email);
        
        setIsAuthenticated(true);
        setUserEmail(email);
        
        // Get user data
        await fetchUserData();
        
        // Set a delay before redirecting
        setTimeout(() => {
          if (userType === UserType.PLAYER) {
            router.push('/');
          } else if (userType === UserType.MANAGER) {
            router.push('/manager/dashboard');
          } else {
            router.push('/');
          }
        }, 500); // Short delay to allow state to update
        
      } catch (error) {
        console.error("Login error:", error);
        setIsAuthenticated(true); // Still set authenticated based on successful token
        setUserEmail(email);
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
        setUserEmail(null);
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
      userEmail, // Adicione ao valor do contexto
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