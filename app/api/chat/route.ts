import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    
    const cafes = await prisma.cafes.findMany({
      where: { status: 'APPROVED' },
      include: { products: true }
    });

    const cafeContext = cafes.map(c => `
      - ${c.name} (${c.location || 'Calamba'}): Vibe: ${c.vibe || 'Cosy'}, Price: ${c.price_level || 'Moderate'}, Desc: ${c.description || 'Great coffee'}
    `).join('\n');

    const systemInstruction = `
      You are the AI Barista Assistant for CafeNav. Provide fast, highly accurate, clean, and organized recommendations based on our active cafes:
      ${cafeContext}
      
      RULES:
      1. Be extremely concise, friendly, and helpful.
      2. Format responses with clean spacing and plain text (no markdown hashes or asterisks).
      3. Recommend exact matching cafes from the list above.
    `;

    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedMessages,
      config: {
        systemInstruction,
        temperature: 0.4,
      }
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error('Error generating AI response:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}