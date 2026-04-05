'use client';

import { useRouter } from 'next/navigation';
import { TypingTest } from '@/components/baseline/TypingTest';
import { BaselineTestShell } from '@/components/baseline/BaselineTestShell';
import { useAuth } from '@/contexts/AuthContext';

export default function TypingTestPage() {
  const router = useRouter();
  const { baselineData, setBaselineData, setIsOnboarding } = useAuth();

  const handleComplete = (result: {
    wpm: number;
    accuracy: number;
    keystrokeVariance: number;
    integrityFlag: boolean;
  }) => {
    setBaselineData({
      ...baselineData,
      typingWPM: result.wpm,
      typingAccuracy: result.accuracy,
      _keystrokeVariance: result.keystrokeVariance,
      _typingIntegrity: result.integrityFlag,
    } as any);
    router.push('/baseline/transition/memory');
  };

  const handleSkip = () => {
    setIsOnboarding(false);
    router.push('/home');
  };

  return (
    <BaselineTestShell testIndex={2} testName="typing test" onSkip={handleSkip}>
      <TypingTest onComplete={handleComplete} />
    </BaselineTestShell>
  );
}
