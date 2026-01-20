"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi, AuthResponseData, LoginRequest } from '@/lib/api';

interface AuthContextType {
    user: AuthResponseData | null;
    loading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthResponseData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const initializeAuth = () => {
            const storedUser = localStorage.getItem('auth_user');
            const token = localStorage.getItem('auth_token');

            if (storedUser && token) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser.primary_role === 'admin') {
                        setUser(parsedUser);
                    } else {
                        // If not admin, clear storage
                        logout();
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error('Failed to parse stored user:', errorMessage);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // Redirect logic
    useEffect(() => {
        if (!loading) {
            if (!user && pathname !== '/login') {
                router.push('/login');
            } else if (user && pathname === '/login') {
                router.push('/');
            }
        }
    }, [user, loading, pathname, router]);

    const login = async (credentials: LoginRequest) => {
        try {
            const response = await authApi.login(credentials);

            if (response.status === 'success' && response.data.primary_role === 'admin') {
                const userData = response.data;
                // TODO: Migrate to httpOnly cookies for better security
                // For now, storing in localStorage with understanding of XSS risks
                localStorage.setItem('auth_token', userData.authToken);
                localStorage.setItem('auth_user', JSON.stringify(userData));
                setUser(userData);
                router.push('/');
            } else if (response.data.primary_role !== 'admin') {
                throw new Error('Unauthorized: Admin access only');
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            // Re-throw with proper error handling
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('An unexpected error occurred during login');
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
