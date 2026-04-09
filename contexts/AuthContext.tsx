'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const USERS_STORAGE_KEY = 'sentinelUsers';
const CURRENT_USER_STORAGE_KEY = 'sentinelCurrentUser';
const ONBOARDING_STORAGE_KEY = 'sentinelIsOnboarding';

export type ClinicalRole =
  | 'HOUSE_OFFICER'
  | 'MEDICAL_OFFICER'
  | 'RESIDENT_JUNIOR'
  | 'RESIDENT_SENIOR'
  | 'CONSULTANT';

export const CLINICAL_ROLE_LABELS: Record<ClinicalRole, string> = {
  HOUSE_OFFICER: 'House Officer',
  MEDICAL_OFFICER: 'Medical Officer',
  RESIDENT_JUNIOR: 'Resident (Junior)',
  RESIDENT_SENIOR: 'Resident (Senior)',
  CONSULTANT: 'Consultant',
};

export function getClinicalRoleLabel(role: ClinicalRole | undefined): string {
  if (!role || !(role in CLINICAL_ROLE_LABELS)) return 'Clinician';
  return CLINICAL_ROLE_LABELS[role];
}

export type RotationType =
  | 'EMERGENCY'
  | 'ICU'
  | 'SURGERY'
  | 'INTERNAL_MEDICINE'
  | 'OBSTETRICS_GYNECOLOGY'
  | 'PEDIATRICS'
  | 'ANESTHESIOLOGY'
  | 'OTHER';

export const ROTATION_LABELS: Record<RotationType, string> = {
  EMERGENCY: 'Emergency',
  ICU: 'ICU',
  SURGERY: 'Surgery',
  INTERNAL_MEDICINE: 'Internal Medicine',
  OBSTETRICS_GYNECOLOGY: 'Obstetrics & Gynecology',
  PEDIATRICS: 'Pediatrics',
  ANESTHESIOLOGY: 'Anesthesiology',
  OTHER: 'Other',
};

export interface User {
  id?: string;
  email: string;
  name: string;
  staffId: string;
  department: string;
  hospital: string;
  clinicalRole?: ClinicalRole;
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
  checkInRotation: RotationType | null;
  setUser: (user: User | null) => void;
  setIsOnboarding: (value: boolean) => void;
  setBaselineData: (data: BaselineData) => void;
  setCheckInRotation: (rotation: RotationType | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isOnboarding, setIsOnboardingState] = useState(false);
  const [baselineData, setBaselineData] = useState<BaselineData | null>(null);
  const [checkInRotation, setCheckInRotationState] = useState<RotationType | null>(null);

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
    setCheckInRotationState(null);
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
    checkInRotation,
    setUser,
    setIsOnboarding,
    setBaselineData,
    setCheckInRotation: setCheckInRotationState,
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
