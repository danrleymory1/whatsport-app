"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; // Importa a biblioteca js-cookie

interface AuthContextProps {
    isAuthenticated: boolean;
    loading: boolean;
    login: (token: string, email: string) => void; // login agora recebe o email
    logout: () => void;
    userEmail: string | null;
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
    const [userEmail, setUserEmail] = useState<string | null>(null); // Estado para o email
    const router = useRouter();

    // --- useEffect (modificado) ---
    useEffect(() => {
        const token = Cookies.get('accessToken'); // Lê do cookie
        const storedEmail = localStorage.getItem("userEmail") //Pega email
        if (token) {
            setIsAuthenticated(true);
            setUserEmail(storedEmail);
        }
        setLoading(false);

        if (!token && !window.location.pathname.startsWith('/auth')) {
            router.push('/auth/sign-in');
        }
    }, [router]);


    // --- Funções login e logout (modificadas) ---
    const login = (token: string, email:string) => {
        Cookies.set('accessToken', token, {
           secure: process.env.NODE_ENV === 'production', // Use true em produção (HTTPS)
           sameSite: 'lax', // Ou 'strict'
        //    expires: settings.ACCESS_TOKEN_EXPIRE_MINUTES / (60 * 24), //Converte min em dias.  Removido, pois vamos usar o tempo de expiração do token JWT diretamente.
         }); // Define o cookie
        localStorage.setItem("userEmail", email); //Salva o email *temporariamente*
        setIsAuthenticated(true);
        setUserEmail(email);
        router.push('/');
    };

    const logout = () => {
        Cookies.remove('accessToken'); // Remove o cookie
        localStorage.removeItem("userEmail") // Remove o email *temporariamente*
        setIsAuthenticated(false);
        setUserEmail(null);
        router.push('/auth/sign-in');
    };


    const value = {
        isAuthenticated,
        loading,
        login,
        logout,
        userEmail
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}