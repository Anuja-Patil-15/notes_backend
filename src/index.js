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
app.set('trust proxy', 1);

// FIX 1: Provide a fallback port number (5000), NOT a URL string!
const PORT = process.env.PORT || 5000;

// Create uploads dir
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// FIX 2: Bulletproof production & development CORS handler
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://nottai.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.indexOf(origin) !== -1;
    const isVercelPreview = /\.vercel\.app$/.test(origin);

    if (isAllowed || isVercelPreview) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS access blocked for this origin.'), false);
    }
  },
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
  console.log(`🚀 Server running on port ${PORT}`);
});
