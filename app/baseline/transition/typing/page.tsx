'use client';

import { Activity02Icon } from '@hugeicons/core-free-icons';
import { TestTransition } from '@/components/baseline/TestTransition';

export default function TypingTransitionPage() {
  return <TestTransition nextLabel="Typing Test" nextHref="/baseline/test/typing" icon={Activity02Icon} />;
}
