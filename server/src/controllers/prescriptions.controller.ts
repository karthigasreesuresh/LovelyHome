import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { GoogleGenAI } from '@google/genai';
import { createWorker } from 'tesseract.js';

export const getPrescriptions = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.query;
    const whereCondition = elderId ? { elderId: String(elderId) } : {};

    const prescriptions = await prisma.prescription.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        elder: {
          select: { id: true, name: true }
        }
      }
    });

    return res.json({ prescriptions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch prescriptions' });
  }
};

export const createPrescription = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId, doctorName, notes, documentUrl, validUntil } = req.body;

    if (!elderId || !doctorName) {
      return res.status(400).json({ error: 'elderId and doctorName are required.' });
    }

    const prescription = await prisma.prescription.create({
      data: {
        elderId,
        doctorName,
        notes,
        documentUrl,
        validUntil: validUntil ? new Date(validUntil) : null,
      }
    });

    return res.json({ prescription });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to add prescription' });
  }
};

export const analyzePrescriptionImage = async (req: AuthRequest, res: Response) => {
  try {
    const { base64Image, imageType, apiKey } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: 'base64Image is required.' });
    }

    const activeApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Strategy 1: If Gemini API Key is available, use Google Gen AI Vision Model
    if (activeApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: activeApiKey });
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: imageType || 'image/jpeg',
                    data: cleanBase64,
                  }
                },
                {
                  text: `You are an expert medical OCR assistant. Analyze this prescription image (which may contain doctor handwriting or printed text).
Extract all prescribed medicines, dosages, timings, frequencies (e.g. 1-0-1, 1-0-0, 0-0-1), and special instructions (e.g. before/after food, duration).
Return ONLY a valid JSON object with the following schema:
{
  "rawText": "Full transcription text of the prescription",
  "medicines": [
    {
      "name": "Medicine Name (e.g. Tab. Augmentin 625mg)",
      "dosage": "Dosage (e.g. 625 mg)",
      "scheduleTime": "Schedule time (e.g. 08:30 AM, 08:30 PM)",
      "frequency": "Frequency (e.g. Twice daily (1-0-1))",
      "instructions": "Instructions (e.g. Take after meals for 5 days)"
    }
  ]
}`
                }
              ]
            }
          ]
        });

        const outputText = response.text || '';
        const jsonMatch = outputText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({
            source: 'GEMINI_VISION_AI',
            rawText: parsed.rawText || outputText,
            candidates: parsed.medicines || []
          });
        }
      } catch (aiErr: any) {
        console.warn('Gemini Vision AI fallback to Tesseract:', aiErr.message);
      }
    }

    // Strategy 2: Server Tesseract OCR Engine
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    const worker = await createWorker('eng');
    const ret = await worker.recognize(imageBuffer);
    const rawText = ret.data.text;
    await worker.terminate();

    return res.json({
      source: 'TESSERACT_OCR_ENGINE',
      rawText,
      candidates: []
    });

  } catch (error: any) {
    console.error('Analyze Prescription Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze prescription image' });
  }
};
