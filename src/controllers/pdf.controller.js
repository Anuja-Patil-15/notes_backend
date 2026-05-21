import { eq, desc, and } from 'drizzle-orm';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import db from '../db/index.js';
import { pdfUploads, aiResults } from '../db/schema.js';
import { generateAIContent } from '../services/ai.service.js';

export const uploadPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded' });

    const fileBuffer = fs.readFileSync(req.file.path);
    let extractedText = '';
    try {
      const data = await pdfParse(fileBuffer);
      extractedText = data.text;
    } catch (parseErr) {
      console.error('PDF parse error:', parseErr);
      extractedText = '';
    }

    const [upload] = await db.insert(pdfUploads).values({
      userId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      extractedText,
    }).returning();

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(201).json(upload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to upload PDF' });
  }
};

export const getUserPDFs = async (req, res) => {
  try {
    const uploads = await db.select({
      id: pdfUploads.id,
      originalName: pdfUploads.originalName,
      fileSize: pdfUploads.fileSize,
      createdAt: pdfUploads.createdAt,
    }).from(pdfUploads)
      .where(eq(pdfUploads.userId, req.user.id))
      .orderBy(desc(pdfUploads.createdAt));

    res.json(uploads);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch PDFs' });
  }
};

export const generateFeature = async (req, res) => {
  try {
    const { pdfId, feature } = req.body;
    const validFeatures = ['summary', 'mcq', 'flowchart', 'short_notes'];

    if (!validFeatures.includes(feature)) {
      return res.status(400).json({ message: 'Invalid feature' });
    }

    // Check if result already exists
    const existing = await db.select().from(aiResults)
      .where(and(
        eq(aiResults.pdfId, pdfId),
        eq(aiResults.feature, feature),
        eq(aiResults.userId, req.user.id)
      )).limit(1);

    if (existing.length > 0) {
      return res.json(existing[0]);
    }

    // Get PDF text
    const [pdf] = await db.select().from(pdfUploads)
      .where(and(eq(pdfUploads.id, pdfId), eq(pdfUploads.userId, req.user.id)));

    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    if (!pdf.extractedText) return res.status(400).json({ message: 'Could not extract text from this PDF' });

    const result = await generateAIContent(feature, pdf.extractedText);

    const [saved] = await db.insert(aiResults).values({
      userId: req.user.id,
      pdfId,
      feature,
      result,
    }).returning();

    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI generation failed: ' + err.message });
  }
};

export const getPDFResults = async (req, res) => {
  try {
    const { pdfId } = req.params;

    const results = await db.select().from(aiResults)
      .where(and(eq(aiResults.pdfId, pdfId), eq(aiResults.userId, req.user.id)))
      .orderBy(desc(aiResults.createdAt));

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch results' });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const results = await db.select({
      id: aiResults.id,
      feature: aiResults.feature,
      result: aiResults.result,
      createdAt: aiResults.createdAt,
      pdfId: aiResults.pdfId,
      originalName: pdfUploads.originalName,
    }).from(aiResults)
      .leftJoin(pdfUploads, eq(aiResults.pdfId, pdfUploads.id))
      .where(eq(aiResults.userId, req.user.id))
      .orderBy(desc(aiResults.createdAt));

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};
