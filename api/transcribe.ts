import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("CRITICAL: API_KEY is missing from environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Simple in-memory rate limiting (per deployment instance)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }

  if (record.count >= 30) {
    return false; // Exceeded limit
  }

  record.count++;
  return true;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST allowed
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
    const { audioBlob, mimeType, prompt } = req.body;

    if (!audioBlob || !mimeType) {
      return res.status(400).json({ error: 'Missing audioBlob or mimeType' });
    }

    console.log(`[Transcribe] Processing audio: ${mimeType}`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBlob
            }
          },
          {
            text: prompt || "Transcribe this audio. Auto-detect language (Chinese, English, or mixed). Transcribe exactly what is said, but fix minor stutters. Do not add any commentary."
          }
        ]
      }
    });

    const text = response.text || "";
    console.log(`[Transcribe] Success`);
    
    return res.status(200).json({ text });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[Transcribe] Error:", errorMessage);
    
    return res.status(500).json({
      error: errorMessage || "Transcription failed"
    });
  }
}
