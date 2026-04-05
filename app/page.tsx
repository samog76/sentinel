'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isOnboarding } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      if (isOnboarding) {
        router.push('/baseline/intro');
      } else {
        router.push('/home');
      }
    } else {
      router.push('/splash');
    }
  }, [isAuthenticated, isOnboarding, router]);

  return null;
}
