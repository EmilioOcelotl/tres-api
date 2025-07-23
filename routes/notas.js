import express from 'express';
import { getAllNotas, getNotaById } from '../controllers/notasController.js';

const router = express.Router();

router.get('/', getAllNotas);
router.get('/:id', getNotaById);

export default router;
