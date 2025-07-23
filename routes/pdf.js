import express from 'express';
import { generarPDF } from '../controllers/pdfController.js';

const router = express.Router();

router.get('/', generarPDF);

export default router;