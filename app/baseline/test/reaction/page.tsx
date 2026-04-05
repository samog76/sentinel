'use client';

import { useRouter } from 'next/navigation';
import { ReactionTest } from '@/components/baseline/ReactionTest';
import { BaselineTestShell } from '@/components/baseline/BaselineTestShell';
import { useAuth } from '@/contexts/AuthContext';

export default function ReactionTestPage() {
  const router = useRouter();
  const { setBaselineData, setIsOnboarding } = useAuth();

  const handleComplete = (result: {
    reactionTime: number;
    rounds: number[];
    integrityFlag: boolean;
  }) => {
    // Store partial results in auth context baseline data (temporary storage)
    setBaselineData({
      reactionTime: result.reactionTime,
      _reactionRounds: result.rounds,
      _reactionIntegrity: result.integrityFlag,
    } as any);
    router.push('/baseline/transition/typing');
  };

  const handleSkip = () => {
    setIsOnboarding(false);
    router.push('/home');
  };

  return (
    <BaselineTestShell testIndex={1} testName="reaction test" onSkip={handleSkip}>
      <ReactionTest onComplete={handleComplete} />
    </BaselineTestShell>
  );
}
