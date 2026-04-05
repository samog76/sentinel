import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_MODEL = 'gemini-3-flash-preview';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { text: 'Gemini API key not configured. Add your key to .env.local' },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json();
    const { prompt, history, systemInstruction } = body as {
      prompt: string;
      history?: { role: string; parts: { text: string }[] }[];
      systemInstruction?: string;
    };

    const contents = [
      ...(history ?? []).map((msg: { role: string; parts: { text: string }[] }) => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: msg.parts,
      })),
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const config: any = {
      temperature: 0.7,
      maxOutputTokens: 512,
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: config,
    });

    const text = response.text ?? 'No response generated.';

    return NextResponse.json({ text });
  } catch (err) {
    console.error('[Gemini API] Unexpected error:', err);
    return NextResponse.json(
      { text: 'An error occurred while generating the response.' },
      { status: 200 }
    );
  }
}
