'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const USERS_STORAGE_KEY = 'sentinelUsers';
const CURRENT_USER_STORAGE_KEY = 'sentinelCurrentUser';
const ONBOARDING_STORAGE_KEY = 'sentinelIsOnboarding';

export interface User {
  id?: string;
  email: string;
  name: string;
  staffId: string;
  department: string;
  hospital: string;
  role: 'doctor' | 'supervisor';
  password: string;
}

interface BaselineData {
  reactionTime?: number;
  typingWPM?: number;
  typingAccuracy?: number;
  memoryScore?: number;
  completedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarding: boolean;
  baselineData: BaselineData | null;
  setUser: (user: User | null) => void;
  setIsOnboarding: (value: boolean) => void;
  setBaselineData: (data: BaselineData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isOnboarding, setIsOnboardingState] = useState(false);
  const [baselineData, setBaselineData] = useState<BaselineData | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedCurrentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    const savedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY);

    if (savedCurrentUser) {
      try {
        const parsedUser = JSON.parse(savedCurrentUser) as User;
        setUserState(parsedUser);
      } catch {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    }

    if (savedOnboarding) {
      setIsOnboardingState(savedOnboarding === 'true');
    }
  }, []);

  const setUser = (nextUser: User | null) => {
    setUserState(nextUser);
    if (typeof window === 'undefined') {
      return;
    }

    if (nextUser) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(nextUser));
      const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
      const users = rawUsers ? (JSON.parse(rawUsers) as User[]) : [];
      const updatedUsers = users.filter(
        (candidate) => candidate.email.toLowerCase() !== nextUser.email.toLowerCase()
      );
      updatedUsers.push(nextUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  };

  const setIsOnboarding = (value: boolean) => {
    setIsOnboardingState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, String(value));
    }
  };

  const logout = () => {
    setUserState(null);
    setIsOnboardingState(false);
    setBaselineData(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'false');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isOnboarding,
    baselineData,
    setUser,
    setIsOnboarding,
    setBaselineData,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
