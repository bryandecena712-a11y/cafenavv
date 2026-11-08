import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CafeRecommendation {
  name: string | null;
  location: string | null;
  vibe: string | null;
  price_level: string | null;
  description: string | null;
  products: { name: string; price: string }[];
}

const STOP_WORDS = new Set([
  'about', 'and', 'any', 'are', 'can', 'cafe', 'cafes', 'coffee', 'could', 'find',
  'for', 'give', 'good', 'have', 'help', 'i', 'in', 'is', 'it', 'me', 'my', 'near',
  'of', 'place', 'please', 'recommend', 'recommendation', 'recommendations', 'shop',
  'shops', 'some', 'suggest', 'the', 'to', 'want', 'what', 'where', 'with',
]);

function getLocalRecommendation(message: string, cafes: CafeRecommendation[]) {
  if (cafes.length === 0) {
    return 'I couldn’t find any approved cafes in the directory right now. Please try again in a little while.';
  }

  const query = message.toLowerCase();
  const terms = query.match(/[a-z0-9₱]+/g)?.filter((term) => term.length > 1 && !STOP_WORDS.has(term)) || [];
  const ranked = cafes
    .map((cafe) => {
      const searchable = [
        cafe.name,
        cafe.location,
        cafe.vibe,
        cafe.price_level,
        cafe.description,
        ...cafe.products.map((product) => product.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      let score = terms.reduce((total, term) => total + (searchable.includes(term) ? 2 : 0), 0);

      if (/\b(study|studying|work|working|focus|quiet|laptop)\b/.test(query) && /deep work|study|quiet|wifi/i.test(searchable)) {
        score += 3;
      }
      if (/\b(outdoor|outside|garden|open air)\b/.test(query) && /outdoor/i.test(searchable)) score += 3;
      if (/\b(budget|cheap|affordable|inexpensive)\b/.test(query) && /₱?100|₱?150|budget|affordable/i.test(searchable)) {
        score += 3;
      }
      if (/\b(chill|relax|relaxing|cozy|cosy|quiet)\b/.test(query) && /chill|cozy|cosy|quiet|reading/i.test(searchable)) {
        score += 2;
      }

      return { cafe, score };
    })
    .sort((a, b) => b.score - a.score);
  const hasMatches = ranked[0]?.score > 0;
  const recommendations = (hasMatches ? ranked.filter(({ score }) => score > 0) : ranked).slice(0, 3);

  const intro = hasMatches
    ? 'Based on what you asked, try:'
    : 'Here are a few cafes in the directory to get you started:';
  const details = recommendations.map(({ cafe }) => {
    const name = cafe.name || 'Cafe';
    const facts = [
      cafe.location,
      cafe.vibe,
      cafe.price_level,
      cafe.products.length
        ? `Menu: ${cafe.products.slice(0, 3).map((product) => `${product.name} (₱${product.price})`).join(', ')}`
        : '',
    ].filter(Boolean);
    return `${name}${facts.length ? ` — ${facts.join(' · ')}` : ''}`;
  });

  return `${intro}\n${details.join('\n')}\n\nTell me your preferred vibe, budget, or drink and I can narrow it down.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body?.messages)) {
      return NextResponse.json({ error: 'Send a valid chat message.' }, { status: 400 });
    }

    const messages = body.messages
      .filter(
        (message: unknown): message is ChatMessage =>
          typeof message === 'object' &&
          message !== null &&
          'role' in message &&
          'content' in message &&
          ((message as ChatMessage).role === 'user' || (message as ChatMessage).role === 'assistant') &&
          typeof (message as ChatMessage).content === 'string'
      )
      .map((message: ChatMessage) => ({ ...message, content: message.content.trim().slice(0, 1000) }))
      .filter((message: ChatMessage) => message.content.length > 0)
      .slice(-12);

    const lastUserMessage = [...messages].reverse().find((message: ChatMessage) => message.role === 'user');
    if (!lastUserMessage) {
      return NextResponse.json({ error: 'Write a message to get a cafe recommendation.' }, { status: 400 });
    }

    const cafes = (await prisma.cafes.findMany({
      where: { status: 'APPROVED' },
      include: {
        products: { where: { status: 'APPROVED' }, select: { name: true, price: true } },
      },
      orderBy: { id: 'desc' },
    })) as CafeRecommendation[];

    const localReply = getLocalRecommendation(lastUserMessage.content, cafes);
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ text: localReply, source: 'cafe-directory' });
    }

    const firstUserMessage = messages.findIndex((message: ChatMessage) => message.role === 'user');
    const conversation = messages.slice(firstUserMessage);
    const formattedMessages = conversation.map((message: ChatMessage) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

    const cafeContext = cafes
      .map(
        (cafe) =>
          `- ${cafe.name} (${cafe.location || 'Calamba'}): Vibe: ${cafe.vibe || 'Not listed'}, Price: ${cafe.price_level || 'Not listed'}, Description: ${cafe.description || 'Not listed'}, Menu: ${cafe.products.map((product) => `${product.name} ₱${product.price}`).join(', ') || 'Not listed'}`
      )
      .join('\n');

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formattedMessages,
        config: {
          systemInstruction: `You are CafeNav's friendly cafe-finding assistant. Recommend only cafes and menu items from this approved directory. Be concise, use exact names, and never invent prices or details. If the user has not said what they like, ask one short follow-up question.\n\nApproved directory:\n${cafeContext || 'No approved cafes are currently listed.'}`,
          temperature: 0.4,
        },
      });

      if (response.text?.trim()) {
        return NextResponse.json({ text: response.text.trim(), source: 'gemini' });
      }
    } catch (error) {
      console.error('Gemini chat failed; using cafe directory recommendations:', error);
    }

    return NextResponse.json({ text: localReply, source: 'cafe-directory' });
  } catch (error) {
    console.error('Error generating chat response:', error);
    return NextResponse.json(
      { error: 'The cafe assistant could not reach the cafe directory. Please try again shortly.' },
      { status: 503 }
    );
  }
}
