"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode
} from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    confirmPasswordReset,
    updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserType } from '@/types/user';
import { toast } from 'sonner';

interface AuthState {
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    user: User | null;
    userEmail: string | null;
    userType: UserType | null;
}

interface AuthContextProps extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signup: (email: string, password: string, userType: UserType) => Promise<boolean>;
    refreshUserData: () => Promise<void>;
    updateProfile: (profileData: Partial<User>) => Promise<boolean>;
    resetPassword: (token: string, password: string) => Promise<boolean>;
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
        error: null,
        user: null,
        userEmail: null,
        userType: null,
    });

    // Fetch user data from Firestore
    const fetchUserData = async (firebaseUser: FirebaseUser) => {
        if (!firebaseUser) return null;

        try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                return userDoc.data() as User;
            } else {
                console.warn('User document not found in Firestore');
                return null;
            }
        } catch (error) {
            console.error('Error fetching user data from Firestore:', error);
            return null;
        }
    };

    // Track authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in
                const userData = await fetchUserData(firebaseUser);

                setAuthState({
                    isAuthenticated: true,
                    loading: false,
                    error: null,
                    user: userData,
                    userEmail: firebaseUser.email,
                    userType: userData?.user_type || null,
                });
            } else {
                // User is signed out
                setAuthState({
                    isAuthenticated: false,
                    loading: false,
                    error: null,
                    user: null,
                    userEmail: null,
                    userType: null,
                });
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Login function
    const login = async (email: string, password: string) => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            const userData = await fetchUserData(firebaseUser);

            setAuthState({
                isAuthenticated: true,
                loading: false,
                error: null,
                user: userData,
                userEmail: firebaseUser.email,
                userType: userData?.user_type || null,
            });

            toast.success(`Bem-vindo ${userData?.user_type === UserType.MANAGER ? 'gerente' : 'jogador'}!`, {
                description: `Logado como ${firebaseUser.email}`,
            });
        } catch (error) {
            console.error("Login error:", error);

            let errorMessage = 'Erro ao fazer login';

            if (error instanceof Error) {
                const authError = error as Error & { code?: string };
                if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
                    errorMessage = 'Email ou senha incorretos';
                } else if (authError.code === 'auth/too-many-requests') {
                    errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde';
                }
            }

            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: errorMessage
            }));

            toast.error(errorMessage);
        }
    };

    // Signup function
    const signup = async (email: string, password: string, userType: UserType): Promise<boolean> => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Create user document in Firestore
            const newUser: User = {
                id: firebaseUser.uid,
                email: email,
                user_type: userType,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const userDocRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userDocRef, newUser);

            setAuthState(prev => ({ ...prev, loading: false }));

            toast.success("Cadastro realizado com sucesso!", {
                description: "Agora você pode fazer login com suas credenciais."
            });

            return true;
        } catch (error) {
            console.error("Signup error:", error);

            let errorMessage = 'Erro ao realizar cadastro';

            if (error instanceof Error) {
                const authError = error as Error & { code?: string };
                if (authError.code === 'auth/email-already-in-use') {
                    errorMessage = 'Este email já está em uso';
                } else if (authError.code === 'auth/invalid-email') {
                    errorMessage = 'Email inválido';
                } else if (authError.code === 'auth/weak-password') {
                    errorMessage = 'Senha muito fraca';
                }
            }

            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: errorMessage
            }));

            toast.error(errorMessage);
            return false;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await signOut(auth);

            // State will be updated by the onAuthStateChanged listener
        } catch (error) {
            console.error('Error during logout:', error);
            toast.error('Erro ao fazer logout');
        }
    };

    // Function to refresh user data
    const refreshUserData = async () => {
        if (!auth.currentUser) return;

        try {
            const userData = await fetchUserData(auth.currentUser);

            if (userData) {
                setAuthState(prev => ({
                    ...prev,
                    user: userData,
                    userType: userData.user_type,
                }));
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

    // Update user profile
    const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
        if (!auth.currentUser || !authState.user) return false;

        try {
            // Update display name in Firebase Auth if name is being updated
            if (profileData.name) {
                await firebaseUpdateProfile(auth.currentUser, {
                    displayName: profileData.name
                });
            }

            // Update user document in Firestore
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, {
                ...profileData,
                updated_at: new Date().toISOString()
            });

            // Update local state
            setAuthState(prev => ({
                ...prev,
                user: { ...prev.user!, ...profileData } as User
            }));

            return true;
        } catch (error) {
            console.error("Update profile error:", error);
            toast.error("Erro ao atualizar perfil");
            return false;
        }
    };

    // Reset password
    const resetPassword = async (actionCode: string, newPassword: string): Promise<boolean> => {
        try {
            await confirmPasswordReset(auth, actionCode, newPassword);
            toast.success("Senha redefinida com sucesso", {
                description: "Você já pode fazer login com sua nova senha."
            });
            return true;
        } catch (error) {
            console.error("Reset password error:", error);

            let errorMessage = 'Erro ao redefinir senha';

            if (error instanceof Error) {
                const authError = error as Error & { code?: string };
                if (authError.code === 'auth/expired-action-code') {
                    errorMessage = 'O link de redefinição expirou ou já foi usado';
                } else if (authError.code === 'auth/invalid-action-code') {
                    errorMessage = 'Link de redefinição inválido';
                } else if (authError.code === 'auth/weak-password') {
                    errorMessage = 'A senha é muito fraca';
                }
            }

            toast.error(errorMessage);
            return false;
        }
    };

    // Forgot password
    const forgotPassword = async (email: string): Promise<boolean> => {
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success("Email de recuperação enviado", {
                description: "Verifique sua caixa de entrada para redefinir sua senha."
            });
            return true;
        } catch (error) {
            console.error("Forgot password error:", error);

            let errorMessage = 'Erro ao enviar email de recuperação';

            if (error instanceof Error) {
                const authError = error as Error & { code?: string };
                if (authError.code === 'auth/user-not-found') {
                    // For security reasons, we don't want to reveal if an email exists or not
                    // So we still show a success message even if the email doesn't exist
                    toast.success("Se este email estiver cadastrado, você receberá instruções para redefinir sua senha.");
                    return true;
                } else if (authError.code === 'auth/invalid-email') {
                    errorMessage = 'Email inválido';
                }
            }

            toast.error(errorMessage);
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