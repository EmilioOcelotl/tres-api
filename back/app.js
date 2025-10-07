// app.js - VERSIÓN MODULARIZADA
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pdfRoutes, threejsRoutes } from './routes/index.js';

// Para usar __dirname con ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8081;

app.use(cors());

// Ruta de presentación para PDF (se mantiene igual por ahora)
app.get('/pdf', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Preparando documento - Tres Estudios Abiertos</title>
        <style>
            html, body {
                height: 100%;
                margin: 0;
                padding: 0;
            }
            body { 
                font-family: 'Arial', sans-serif; 
                text-align: center; 
                background: linear-gradient(135deg, rgb(20, 21, 23) 0%, rgb(112, 112, 112) 100%);
                color: #333;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
            }
            .container {
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                padding: 40px;
                border-radius: 15px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                max-width: 500px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                margin: 20px;
            }
            .spinner {
                border: 4px solid rgba(0, 0, 0, 0.1);
                border-top: 4px solid #555;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            h1 {
                margin-bottom: 10px;
                font-size: 24px;
                color: #333;
            }
            p {
                margin: 10px 0;
                color: #666;
                line-height: 1.5;
            }
            .progress {
                margin: 20px 0;
                font-size: 14px;
                color: #777;
                font-weight: 500;
            }
            .success {
                color: #2e7d32;
                font-weight: bold;
            }
            .checkmark {
                font-size: 48px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🖨️ Generando Documento</h1>
            <div class="spinner" id="spinner"></div>
            <div class="checkmark" id="checkmark" style="display: none;">✅</div>
            <p><strong>Tres Estudios Abiertos</strong></p>
            <p>Estamos preparando tu PDF con todo el contenido...</p>
            <div class="progress" id="progress">⏳ Preparando documento...</div>
            <p id="status-message">La descarga comenzará automáticamente.</p>
        </div>
        <script>
            // Mostrar mensaje y luego redireccionar
            let dots = 0;
            const progress = document.querySelector('#progress');
            const spinner = document.querySelector('#spinner');
            const checkmark = document.querySelector('#checkmark');
            const statusMessage = document.querySelector('#status-message');
            
            const interval = setInterval(() => {
                dots = (dots + 1) % 4;
                progress.textContent = '⏳ Preparando documento' + '.'.repeat(dots);
            }, 500);
            
            // Cambiar a "descarga realizada" después de 1.5 segundos
            setTimeout(() => {
                clearInterval(interval);
                // Ocultar spinner y mostrar checkmark
                spinner.style.display = 'none';
                checkmark.style.display = 'block';
                
                // Cambiar mensajes
                progress.textContent = '✅ Descarga realizada';
                progress.className = 'progress success';
                statusMessage.textContent = 'El PDF se ha descargado correctamente.';
                
                // Cambiar título del documento
                document.querySelector('h1').textContent = '✅ Documento Listo';
                
            }, 1500);
            
            // Redireccionar después de 2 segundos para iniciar la descarga
            setTimeout(() => {
                window.location.href = '/api/pdf';
            }, 2000);
        </script>
    </body>
    </html>
  `);
});

// Montar rutas modularizadas
app.use('/api/pdf', pdfRoutes);
app.use('/api/3d', threejsRoutes);

// Health check general
app.get('/health', (req, res) => {
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
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de Tres Estudios Abiertos',
    endpoints: {
      pdf: {
        generate: '/pdf (interfaz) → /api/pdf (descarga)',
        description: 'Genera el PDF completo de la tesis'
      },
      threejs: {
        structure: '/api/3d/structure',
        noteContent: '/api/3d/note/:id/content',
        search: '/api/3d/search?q=query',
        description: 'Endpoints para el visualizador 3D'
      },
      health: '/health'
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /health', 
      'GET /pdf',
      'GET /api/pdf',
      'GET /api/3d/structure',
      'GET /api/3d/note/:id/content',
      'GET /api/3d/search'
    ]
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

app.listen(port, () => {
  console.log('='.repeat(60));
  console.log('🚀 Servidor modularizado corriendo!');
  console.log(`📍 http://localhost:${port}`);
  console.log('='.repeat(60));
  console.log('📊 Endpoints disponibles:');
  console.log(`   📄 PDF: http://localhost:${port}/pdf`);
  console.log(`   🎮 Three.js: http://localhost:${port}/api/3d/structure`);
  console.log(`   ❓ Health: http://localhost:${port}/health`);
  console.log('='.repeat(60));
});