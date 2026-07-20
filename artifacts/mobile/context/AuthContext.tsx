import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import * as db from '@/services/db';
import { User, RegisterFormData } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => { throw new Error('Not ready'); },
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const u = await db.getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Initial session check
    (async () => {
      await refreshUser();
      setIsLoading(false);
    })();

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshUser();
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await db.loginUser(email, password);
    setUser(u);
  }, []);

  const register = useCallback(async (data: RegisterFormData): Promise<User> => {
    const u = await db.registerUser(data);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await db.logoutUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
