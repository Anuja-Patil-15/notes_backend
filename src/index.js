import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import authRoutes from './routes/auth.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || https://notes-backend-70vb.onrender.com;

// Create uploads dir
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'https://nottai.vercel.app',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
