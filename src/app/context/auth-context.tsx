"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode 
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { User, UserType } from '@/types/user';
import { apiService } from '@/services/api-service';
import { toast } from 'sonner';

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null; // Sempre usar null, não undefined
  user: User | null;
  userEmail: string | null;
  userType: UserType | null;
}

interface AuthContextProps extends AuthState {
  login: (token: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, userType: UserType) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
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
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    error: null, // inicializado como null
    user: null,
    userEmail: null,
    userType: null,
  });
  
  const router = useRouter();
  const pathname = usePathname();

  // Fetch user data after authentication
  const fetchUserData = useCallback(async () => {
    try {
      // Only attempt to fetch if we have a token
      const token = Cookies.get('accessToken');
      if (!token) {
        console.log('No token available, skipping user data fetch');
        return false;
      }
    
      const userData = await apiService.getCurrentUser();
      
      if (userData && userData.data) {
        setAuthState(prev => ({
          ...prev,
          user: userData.data,
          userType: userData.data.user_type as UserType,
          userEmail: userData.data.email,
        }));
        return true;
      } else {
        // Handle empty or invalid response
        console.warn('Empty or invalid user data response');
        
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          userType: null,
          userEmail: null,
          error: 'Failed to fetch user data'
        }));
        return false;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Only clear auth state if token is invalid/expired
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          userType: null,
          userEmail: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
        
        // Clean up invalid tokens
        Cookies.remove('accessToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userEmail');
      }
      
      return false;
    }
  }, []);

  // Check auth status on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
      const storedEmail = localStorage.getItem("userEmail");
      
      setAuthState(prev => ({ ...prev, loading: true }));
      
      if (token) {
        try {
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            userEmail: storedEmail,
          }));
          
          await fetchUserData();
        } catch (error) {
          console.error("Error during authentication check:", error);
          
          // Only redirect to login if we're not already on a login page
          if (!pathname.startsWith('/auth/')) {
            router.push('/auth/sign-in');
          }
        } finally {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          loading: false,
          error: null,
          user: null,
          userType: null,
          userEmail: null,
        });
        
        // Only redirect to login if we're not already on a public route
        const publicRoutes = ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password', '/auth/reset-password'];
        
        if (!publicRoutes.some(route => pathname.startsWith(route)) && 
            !pathname.startsWith('/_next')) {
          router.push('/auth/sign-in');
        }
      }
    };
    
    checkAuth();
  }, [pathname, router, fetchUserData]);
  
  // Login function
  const login = async (token: string, email: string) => {
    try {
      // Store token in both cookie and localStorage with proper configuration
      Cookies.set('accessToken', token, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: 1 // 1 day
      });
      
      localStorage.setItem('accessToken', token);
      localStorage.setItem("userEmail", email);
      
      setAuthState(prev => ({
        ...prev, 
        isAuthenticated: true,
        userEmail: email,
        error: null
      }));
      
      // Aguardar um momento para garantir que o token seja salvo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get user data
      const success = await fetchUserData();
      
      if (success) {
        // Atualize o token no apiService
        await fetchUserData();
        
        // Navigate based on user type
        const userType = authState.userType;
        
        router.push(userType === UserType.PLAYER ? '/player' : '/manager');
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthState(prev => ({ 
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to login'
      }));
    }
  };

  // Signup function
  const signup = async (email: string, password: string, userType: UserType): Promise<boolean> => {
    try {
      const response = await apiService.register({
        email,
        password,
        user_type: userType
      });
      
      if (response.error) {
        setAuthState(prev => ({ 
          ...prev, 
          error: response.error || null // Garantir que é null e não undefined
        }));
        return false;
      }
      
      toast.success("Cadastro realizado com sucesso!", {
        description: "Agora você pode fazer login com suas credenciais."
      });
      
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to register'
      }));
      return false;
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
      localStorage.removeItem('accessToken');
      localStorage.removeItem("userEmail");
      
      setAuthState({
        isAuthenticated: false,
        loading: false,
        error: null,
        user: null,
        userType: null,
        userEmail: null,
      });
      
      router.push('/auth/sign-in');
    }
  };

  // Function to refresh user data
  const refreshUserData = async () => {
    if (authState.isAuthenticated) {
      await fetchUserData();
    }
  };
  
  // Update user profile
  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      const response = await apiService.updateProfile(profileData);
      
      if (response.error) {
        setAuthState(prev => ({ ...prev, error: response.error || null }));
        return false;
      }
      
      // Update user data in state
      if (response.data) {
        setAuthState(prev => ({
          ...prev,
          user: { ...prev.user, ...response.data } as User
        }));
      }
      
      return true;
    } catch (error) {
      console.error("Update profile error:", error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to update profile'
      }));
      return false;
    }
  };
  
  // Reset password
  const resetPassword = async (token: string, password: string, confirmPassword: string): Promise<boolean> => {
    try {
      const response = await apiService.resetPassword(token, {
        password,
        confirm_password: confirmPassword
      });
      
      if (response.error) {
        setAuthState(prev => ({ ...prev, error: response.error || null }));
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Reset password error:", error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to reset password'
      }));
      return false;
    }
  };
  
  // Forgot password
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await apiService.forgotPassword({ email });
      
      if (response.error) {
        setAuthState(prev => ({ ...prev, error: response.error || null }));
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Forgot password error:", error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to process password reset'
      }));
      return false;
    }
  };

  const value = {
    ...authState,
    login,
    logout,
    signup,
    refreshUserData,
    updateProfile,
    resetPassword,
    forgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}