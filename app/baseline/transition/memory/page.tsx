'use client';

import { Moon01Icon } from '@hugeicons/core-free-icons';
import { TestTransition } from '@/components/baseline/TestTransition';

export default function MemoryTransitionPage() {
  return <TestTransition nextLabel="Memory Game" nextHref="/baseline/test/memory" icon={Moon01Icon} />;
}
