import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, RegisterFormData } from '@/types';
import * as storage from '@/services/storage';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      await storage.initStorage();
      const currentUser = await storage.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Auth bootstrap error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const loggedIn = await storage.loginUser(email, password);
    setUser(loggedIn);
  }

  async function register(data: RegisterFormData) {
    const newUser = await storage.registerUser(data);
    setUser(newUser);
  }

  async function logout() {
    await storage.logoutUser();
    setUser(null);
  }

  async function refreshUser() {
    const currentUser = await storage.getCurrentUser();
    setUser(currentUser);
  }

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
