import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth.js';
import { uploadPDF, getUserPDFs, generateFeature, getPDFResults, getUserHistory } from '../controllers/pdf.controller.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('pdf'), uploadPDF);
router.get('/my-pdfs', getUserPDFs);
router.post('/generate', generateFeature);
router.get('/:pdfId/results', getPDFResults);
router.get('/history/all', getUserHistory);

export default router;
