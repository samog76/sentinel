/**
 * Gemini API client helpers for Sentinel.
 * All calls go through the Next.js route handler at /api/gemini
 * to keep the API key server-side.
 */

import type { CheckIn, BaselineData } from '@/contexts/ShiftContext';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

/**
 * Call the Gemini proxy API. Returns the raw text response.
 */
export async function callGemini(
  prompt: string,
  history?: GeminiMessage[],
  systemInstruction?: string
): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, history, systemInstruction }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.error('[Gemini] API error:', res.status, errorText);
    throw new Error(`Gemini API error ${res.status}`);
  }

  const data = await res.json();
  return data.text ?? '';
}

/* ─── Prompt builders ──────────────────────────────────── */

export function buildInsightPrompt(opts: {
  doctorName: string;
  fatigueScore: number;
  baseline: BaselineData;
  deviations: { reaction: number; typing: number; memory: number };
  hoursOnShift: number;
  checksCompleted: number;
}): string {
  return `You are Sentinel, a clinical fatigue monitoring AI for healthcare professionals. Be direct, precise, and caring.

Context:
- Doctor: ${opts.doctorName}
- Current fatigue score: ${opts.fatigueScore}/100
- Hours on shift: ${opts.hoursOnShift.toFixed(1)}
- Check-ins completed: ${opts.checksCompleted}
- Baseline: reaction ${opts.baseline.reactionTime}ms, ${opts.baseline.wpm} WPM, ${opts.baseline.accuracy}% accuracy, memory ${opts.baseline.memoryScore}/5
- Deviations from baseline: reaction ${opts.deviations.reaction > 0 ? '+' : ''}${opts.deviations.reaction}%, typing ${opts.deviations.typing > 0 ? '+' : ''}${opts.deviations.typing}%, memory ${opts.deviations.memory > 0 ? '+' : ''}${opts.deviations.memory}%

Return exactly 1-2 sentences of personalized clinical observation in plain English. No markdown, no bullet points, no formatting. Be specific about numbers.`;
}

export function buildOverviewPrompt(opts: {
  doctorName: string;
  hoursOnShift: number;
  baseline: BaselineData;
  checkIns: CheckIn[];
}): string {
  const checkInSummary = opts.checkIns
    .map(
      (c, i) =>
        `Check-in ${i + 1} (${c.timestamp.toLocaleTimeString()}): fatigue ${c.fatigueScore}, reaction ${c.reactionTime}ms, WPM ${c.wpm}, accuracy ${c.accuracy}%, memory ${c.memoryScore}/5, status: ${c.status}`
    )
    .join('\n');

  return `You are Sentinel, a clinical fatigue monitoring system. Write a concise shift summary paragraph (3-5 sentences) for a healthcare professional.

Context:
- Doctor: ${opts.doctorName}
- Hours on shift: ${opts.hoursOnShift.toFixed(1)}
- Baseline: reaction ${opts.baseline.reactionTime}ms, ${opts.baseline.wpm} WPM, ${opts.baseline.accuracy}% accuracy, memory ${opts.baseline.memoryScore}/5
- Check-in data:
${checkInSummary || 'No check-ins yet.'}

Write a short paragraph shift summary. Plain text only. Be clinical but human. Mention specific numbers. No markdown formatting.`;
}

export function buildCoachSystemPrompt(opts: {
  doctorName: string;
  clockInTime: Date;
  hoursOnShift: number;
  fatigueScore: number;
  baseline: BaselineData;
  checkIns: CheckIn[];
}): string {
  const checkInSummary = opts.checkIns
    .map(
      (c, i) =>
        `Check-in ${i + 1} (${c.timestamp.toLocaleTimeString()}): fatigue ${c.fatigueScore}, reaction ${c.reactionTime}ms, WPM ${c.wpm}, accuracy ${c.accuracy}%, memory ${c.memoryScore}/5, status: ${c.status}`
    )
    .join('\n');

  return `You are Sentinel, an AI shift coach for healthcare professionals monitoring cognitive fatigue. You speak directly, plainly, and supportively. Never use markdown or formatting in your responses — plain text only.

You can also act as a helper for prescribing drugs for patient symptoms (AS A HELPER ONLY, always advising the doctor to verify independently).

Current shift state for Dr. ${opts.doctorName}:
- Clocked in: ${opts.clockInTime.toLocaleTimeString()}
- Hours on shift: ${opts.hoursOnShift.toFixed(1)}
- Current fatigue score: ${opts.fatigueScore}/100
- Baseline: reaction ${opts.baseline.reactionTime}ms, ${opts.baseline.wpm} WPM, ${opts.baseline.accuracy}% acc, memory ${opts.baseline.memoryScore}/5
${checkInSummary ? `- Check-ins:\n${checkInSummary}` : '- No check-ins completed yet.'}

Answer the doctor's questions with context-aware, helpful responses. Keep answers concise (2-4 sentences). If they ask if they're okay to continue, base your answer on the data.`;
}
