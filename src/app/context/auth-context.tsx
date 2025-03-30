"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

interface AuthContextProps {
    isAuthenticated: boolean;
    loading: boolean;
    login: (token: string, email: string, userType: string) => void;
    logout: () => void;
    userEmail: string | null;
    userType: string | null;
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
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userType, setUserType] = useState<string | null>(null);
    const router = useRouter();

    // Effect to check auth status on mount
    useEffect(() => {
        const token = Cookies.get('accessToken');
        const storedEmail = localStorage.getItem("userEmail");
        const storedUserType = localStorage.getItem("userType");
        
        if (token) {
            setIsAuthenticated(true);
            setUserEmail(storedEmail);
            setUserType(storedUserType);
        }
        setLoading(false);

        if (!token && !window.location.pathname.startsWith('/auth')) {
            router.push('/auth/sign-in');
        }
    }, [router]);

    const login = (token: string, email: string, type: string) => {
        Cookies.set('accessToken', token, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userType", type);
        setIsAuthenticated(true);
        setUserEmail(email);
        setUserType(type);
        router.push('/');
    };

    const logout = () => {
        Cookies.remove('accessToken');
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userType");
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserType(null);
        toast.info("Logout realizado com sucesso");
        router.push('/auth/sign-in');
    };

    const value = {
        isAuthenticated,
        loading,
        login,
        logout,
        userEmail,
        userType
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

    }