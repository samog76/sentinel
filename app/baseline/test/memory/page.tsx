'use client';

import { useRouter } from 'next/navigation';
import { MemoryTest } from '@/components/baseline/MemoryTest';
import { BaselineTestShell } from '@/components/baseline/BaselineTestShell';
import { useAuth } from '@/contexts/AuthContext';

export default function MemoryTestPage() {
  const router = useRouter();
  const { baselineData, setBaselineData, setIsOnboarding } = useAuth();

  const handleComplete = (result: {
    score: number;
    responseTimes: number[];
    integrityFlag: boolean;
  }) => {
    setBaselineData({
      ...baselineData,
      memoryScore: result.score,
      _memoryResponseTimes: result.responseTimes,
      _memoryIntegrity: result.integrityFlag,
      completedAt: new Date().toISOString(),
    } as any);
    router.push('/baseline/complete');
  };

  const handleSkip = () => {
    setIsOnboarding(false);
    router.push('/home');
  };

  return (
    <BaselineTestShell testIndex={3} testName="memory game" onSkip={handleSkip}>
      <MemoryTest onComplete={handleComplete} />
    </BaselineTestShell>
  );
}
