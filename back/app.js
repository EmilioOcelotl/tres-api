// app.js - Servidor completo con front y API
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pdfRoutes, threejsRoutes } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8081;

app.use(cors());

// Servir archivos estáticos del front (index.html, main.js, style.css)
app.use(express.static(path.resolve(__dirname, '../front')));

// Ruta de presentación para PDF
app.get('/pdf', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Preparando documento - Tres Estudios Abiertos</title>
        <style>
          html, body { height: 100%; margin:0; padding:0; font-family: Arial, sans-serif; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #141517 0%, #707070 100%); color:#333; }
          .container { background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); padding:40px; border-radius:15px; border:1px solid rgba(0,0,0,0.1); max-width:500px; box-shadow:0 8px 32px rgba(0,0,0,0.1); text-align:center; }
          .spinner { border:4px solid rgba(0,0,0,0.1); border-top:4px solid #555; border-radius:50%; width:50px; height:50px; animation:spin 1s linear infinite; margin:20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
          .checkmark { font-size:48px; margin:20px 0; display:none; }
          .progress { margin:20px 0; font-size:14px; color:#777; font-weight:500; }
          .success { color:#2e7d32; font-weight:bold; }
        </style>
    </head>
    <body>
      <div class="container">
        <h1>🖨️ Generando Documento</h1>
        <div class="spinner" id="spinner"></div>
        <div class="checkmark" id="checkmark">✅</div>
        <p><strong>Tres Estudios Abiertos</strong></p>
        <p>Estamos preparando tu PDF con todo el contenido...</p>
        <div class="progress" id="progress">⏳ Preparando documento...</div>
        <p id="status-message">La descarga comenzará automáticamente.</p>
      </div>
      <script>
        let dots = 0;
        const progress = document.querySelector('#progress');
        const spinner = document.querySelector('#spinner');
        const checkmark = document.querySelector('#checkmark');
        const statusMessage = document.querySelector('#status-message');

        const interval = setInterval(() => {
          dots = (dots+1)%4;
          progress.textContent = '⏳ Preparando documento'+'.'.repeat(dots);
        }, 500);

        setTimeout(() => {
          clearInterval(interval);
          spinner.style.display = 'none';
          checkmark.style.display = 'block';
          progress.textContent = '✅ Descarga realizada';
          progress.className = 'progress success';
          statusMessage.textContent = 'El PDF se ha descargado correctamente.';
          document.querySelector('h1').textContent = '✅ Documento Listo';
        }, 1500);

        setTimeout(() => {
          window.location.href = '/api/pdf';
        }, 2000);
      </script>
    </body>
    </html>
  `);
});

// Montar rutas de API
app.use('/api/pdf', pdfRoutes);
app.use('/api/3d', threejsRoutes);

// Health check
app.get('/health', (req,res) => {
  res.json({
    status: 'OK',
    service: 'Tres Estudios Abiertos API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      pdf: '/api/pdf',
      threejs: '/api/3d',
      health: '/health'
    }
  });
});

// Ruta de bienvenida
app.get('/', (req,res) => {
  res.sendFile(path.resolve(__dirname, '../front/index.html'));
});

// Rutas no encontradas
app.use('*', (req,res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejo global de errores
app.use((err, req,res,next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message });
});

app.listen(port, () => {
  console.log(`=`.repeat(60));
  console.log(`🚀 Servidor corriendo!`);
  console.log(`📍 http://localhost:${port}`);
  console.log(`📄 PDF: http://localhost:${port}/pdf`);
  console.log(`🎮 Front: http://localhost:${port}/`);
  console.log(`🎮 Three.js: http://localhost:${port}/api/3d/structure`);
  console.log(`=`.repeat(60));
});
