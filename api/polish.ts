import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("CRITICAL: API_KEY is missing from environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (record.count >= 30) {
    return false;
  }

  record.count++;
  return true;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
             (req.headers['x-real-ip'] as string) || 
             'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }

  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Missing content' });
    }

    console.log(`[Polish] Processing content`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `You are an expert personal knowledge management assistant. 
      Refine the following raw note into a clean, concise Markdown format.

      STRICT RULES:
      1. DO NOT include any introductory phrases like "Here is your note" or "Okay, I've cleaned it up".
      2. DO NOT include any meta-commentary or conversational filler.
      3. OUTPUT ONLY the refined note content itself.
      4. Fix grammar and spelling.
      5. If it looks like a task, format it as a checklist item.
      6. Add a relevant #tag at the end based on the context.
      7. Keep the tone personal.
      8. Preserve the original language (Chinese stays Chinese, English stays English).
      
      Raw Note:
      ${content}`,
    });

    const text = response.text?.trim() || "";
    console.log(`[Polish] Success`);
    
    return res.status(200).json({ text });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[Polish] Error:", errorMessage);
    
    return res.status(500).json({
      error: errorMessage || "Polish failed"
    });
  }
}
