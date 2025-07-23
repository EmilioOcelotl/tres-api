import { createPDF } from '../utils/pdfGenerator.js';

export async function generarPDF(req, res) {
  const pdfBuffer = await createPDF();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=notas.pdf');
  res.send(pdfBuffer);
}