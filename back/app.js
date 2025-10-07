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
      },import express from 'express';
      import sqlite3 from 'sqlite3';
      import cors from 'cors';
      import PDFDocument from 'pdfkit';
      import turndown from 'turndown';
      import path from 'path';
      import { fileURLToPath } from 'url';
      import fs from 'fs';
      
      // Para usar __dirname con ES modules
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      const app = express();
      const port = 8081;
      
      app.use(cors());
      
      // RUTAS CORREGIDAS - desde back/app.js
      const databasePath = path.join(__dirname, 'database', 'loving_kepler.db');
      const fontsPath = path.join(__dirname, '..', 'assets', 'fonts');
      
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
      
      // Función para construir árbol jerárquico a partir de notas y ramas (branches)
      function buildTree(notes, branches) {
        // Crear mapa de nodos
        const nodesMap = new Map();
        notes.forEach(note => {
          nodesMap.set(note.noteId, { ...note, children: [] });
        });
      
        let rootNodes = [];
      
        branches.forEach(branch => {
          const node = nodesMap.get(branch.noteId);
          if (!node) return; // seguridad
          if (branch.parentNoteId && nodesMap.has(branch.parentNoteId)) {
            nodesMap.get(branch.parentNoteId).children.push(node);
          } else {
            rootNodes.push(node);
          }
        });
      
        // ORDENAR LOS HIJOS POR notePosition - AGREGAR ESTA PARTE
        nodesMap.forEach((node, noteId) => {
          if (node.children.length > 0) {
            node.children.sort((a, b) => {
              const branchA = branches.find(br => br.noteId === a.noteId && br.parentNoteId === noteId);
              const branchB = branches.find(br => br.noteId === b.noteId && br.parentNoteId === noteId);
              const posA = branchA?.notePosition || 0;
              const posB = branchB?.notePosition || 0;
              return posA - posB;
            });
          }
        });
      
        // También ordenar rootNodes si hay múltiples
        if (rootNodes.length > 1) {
          rootNodes.sort((a, b) => {
            const branchA = branches.find(br => br.noteId === a.noteId && !br.parentNoteId);
            const branchB = branches.find(br => br.noteId === b.noteId && !br.parentNoteId);
            const posA = branchA?.notePosition || 0;
            const posB = branchB?.notePosition || 0;
            return posA - posB;
          });
        }
      
        return rootNodes.length === 1 ? rootNodes[0] : rootNodes;
      }
      
      // Función para encontrar nodo por título (recursiva)
      function findNodeByTitle(nodes, title) {
        if (Array.isArray(nodes)) {
          for (const node of nodes) {
            const found = findNodeByTitle(node, title);
            if (found) return found;
          }
          return null;
        }
      
        if (nodes.title === title) return nodes;
      
        for (const child of nodes.children) {
          const found = findNodeByTitle(child, title);
          if (found) return found;
        }
      
        return null;
      }
      
      // Función para generar índice solo con primer nivel (capítulos principales)
      function insertarIndice(doc, capitulos, fontPath) {
        doc.addPage(); // Página en blanco después de portada
      
        doc.font(fontPath)
          .fontSize(16)
          .text('ÍNDICE', {
            align: 'center',
            underline: true
          })
          .moveDown(1.5);
      
        // Solo mostrar los títulos de primer nivel (capítulos principales)
        for (const capitulo of capitulos) {
          doc.font(fontPath)
            .fontSize(12)
            .text(capitulo.title, {
              indent: 0,
              continued: false
            });
      
          doc.moveDown(0.5);
        }
      
        doc.moveDown(2);
      }
      
      // Función para filtrar nodos "Hidden Notes" y sus hijos
      function filtrarHiddenNotes(nodo) {
        if (!nodo) return null;
        
        // Si encontramos "Hidden Notes", retornamos null para omitirlo completamente
        if (nodo.title === 'Hidden Notes') {
          console.log('Filtrando Hidden Notes y todo su contenido');
          return null;
        }
        
        // Si el nodo tiene hijos, filtramos recursivamente
        if (nodo.children && nodo.children.length > 0) {
          const hijosFiltrados = nodo.children
            .map(hijo => filtrarHiddenNotes(hijo))
            .filter(hijo => hijo !== null);
          
          return {
            ...nodo,
            children: hijosFiltrados
          };
        }
        
        return nodo;
      }
      
      // Función para procesar contenido jerárquico completo
      function procesarContenidoJerarquico(doc, nodo, turndownService, nivel = 0, contadorPaginas, fontPath) {
        if (!nodo) return contadorPaginas;
      
        // Configurar estilos según el nivel
        let fontSize, indent, isTitle;
        
        switch (nivel) {
          case 0: // Capítulo principal - NUEVA PÁGINA
            doc.addPage(); // SOLO los capítulos principales tienen nueva página
            fontSize = 18;
            indent = 0;
            isTitle = true;
            
            // Título del capítulo en mayúsculas y centrado
            doc.font(fontPath)
              .fontSize(fontSize)
              .text(nodo.title.toUpperCase(), {
                align: 'center',
                paragraphGap: 20
              })
              .moveDown(1);
            break;
            
          case 1: // Subcapítulo - SIN SALTO DE PÁGINA
            fontSize = 14;
            indent = 20;
            isTitle = true;
            
            // Verificar si hay espacio suficiente en la página actual
            const alturaNecesaria = fontSize * 3; // Espacio aproximado para el título
            if (doc.y + alturaNecesaria > doc.page.height - 72) { // 72 = margen inferior
              doc.addPage();
            }
            
            doc.font(fontPath)
              .fontSize(fontSize)
              .text(nodo.title, {
                indent: indent,
                paragraphGap: 10
              })
              .moveDown(0.5);
            break;
            
          case 2: // Tercer nivel - SIN SALTO DE PÁGINA
            fontSize = 12;
            indent = 40;
            isTitle = true;
            
            // Verificar si hay espacio suficiente en la página actual
            const alturaNecesaria2 = fontSize * 3;
            if (doc.y + alturaNecesaria2 > doc.page.height - 72) {
              doc.addPage();
            }
            
            doc.font(fontPath)
              .fontSize(fontSize)
              .text(nodo.title, {
                indent: indent,
                paragraphGap: 5
              })
              .moveDown(0.3);
            break;
            
          default: // Contenido normal - SIN SALTO DE PÁGINA
            fontSize = 11;
            indent = nivel * 20;
            isTitle = false;
        }
      
        // Procesar contenido si existe
        if (nodo.content && nodo.content.trim() !== '') {
          let markdown;
          try {
            // Convertir el contenido a string si es un Buffer
            const content = Buffer.isBuffer(nodo.content) ? nodo.content.toString('utf8') : nodo.content;
            markdown = turndownService.turndown(content);
          } catch (error) {
            console.error('Error procesando contenido:', error);
            markdown = '(error al procesar contenido)';
          }
      
          // Para contenido que no es título, aplicar el formato normal
          if (!isTitle) {
            doc.font(fontPath)
              .fontSize(fontSize)
              .text(markdown, {
                indent: indent,
                paragraphGap: 5,
                lineGap: 3
              })
              .moveDown(0.3);
          } else {
            // Para títulos, el contenido va después con indentación adicional
            if (markdown.trim() !== '') {
              doc.font(fontPath)
                .fontSize(11)
                .text(markdown, {
                  indent: indent + 10,
                  paragraphGap: 5,
                  lineGap: 3
                })
                .moveDown(0.3);
            }
          }
          
          contadorPaginas++;
        }
      
        // Procesar hijos recursivamente (ya filtrados)
        if (nodo.children && nodo.children.length > 0) {
          for (const hijo of nodo.children) {
            contadorPaginas = procesarContenidoJerarquico(
              doc, 
              hijo, 
              turndownService, 
              nivel + 1, 
              contadorPaginas,
              fontPath
            );
          }
        }
      
        return contadorPaginas;
      }
      
      app.get('/api/pdf', async (req, res) => {
        let db;
        try {
          // Ruta de la fuente
          const fontPath = path.join(fontsPath, 'SpaceGrotesk.ttf');
          console.log('Usando fuente en:', fontPath);
      
          // Verificar que existe la fuente
          const fs = await import('fs');
          if (!fs.existsSync(fontPath)) {
            throw new Error(`No se encuentra la fuente: ${fontPath}`);
          }
      
          // 1. Consultas a la base de datos - USANDO RUTA ABSOLUTA
          const result = await new Promise((resolve, reject) => {
            db = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY, (err) => {
              if (err) return reject(err);
              
              console.log('Conectado a la base de datos para consulta');
      
              // Consulta modificada para usar la estructura de blobs
              db.all(`
                SELECT n.noteId, n.title, b.content
                FROM notes n
                LEFT JOIN blobs b ON n.blobId = b.blobId
                WHERE n.isDeleted = 0
              `, [], (err, notes) => {
                if (err) {
                  console.error('Error en consulta de notas:', err);
                  return reject(err);
                }
      
                console.log(`Encontradas ${notes.length} notas`);
      
                db.all(`SELECT branchId, noteId, parentNoteId, notePosition FROM branches WHERE isDeleted = 0`, [], (err, branches) => {
                  if (err) {
                    console.error('Error en consulta de branches:', err);
                    return reject(err);
                  }
      
                  console.log(`Encontradas ${branches.length} ramas`);
                  resolve({ notes, branches });
                });
              });
            });
          });
      
          const { notes, branches } = result;
      
          // 2. Construir el árbol (las notas ya vienen con el contenido)
          console.log('Construyendo árbol...');
          const tree = buildTree(notes, branches);
          
          // Buscar la raíz
          let root = findNodeByTitle(tree, 'Tres');
          
          if (!root) {
            // Si no encuentra "Tres", intenta con otros nombres posibles
            root = findNodeByTitle(tree, 'Tres Estudios Abiertos') || 
                   findNodeByTitle(tree, 'TRES ESTUDIOS ABIERTOS') ||
                   findNodeByTitle(tree, 'tres estudios abiertos');
          }
      
          if (!root) {
            console.log('No se encontró la raíz. Nodos disponibles:');
            if (Array.isArray(tree)) {
              tree.forEach(node => console.log('-', node.title));
            } else {
              console.log('-', tree.title);
            }
            return res.status(404).json({ error: 'No se encontró la nota raíz "Tres"' });
          }
      
          console.log(`Raíz encontrada: "${root.title}" con ${root.children?.length || 0} hijos`);
      
          // FILTRAR HIDDEN NOTES ANTES DE PROCESAR - FILTRAR LOS HIJOS DEL ROOT
          const childrenFiltrados = root.children
            ? root.children.map(child => filtrarHiddenNotes(child)).filter(child => child !== null)
            : [];
          
          const rootFiltrado = {
            ...root,
            children: childrenFiltrados
          };
      
          console.log(`Después de filtrar: ${rootFiltrado.children?.length || 0} hijos`);
      
          // 3. Configuración del PDF
          const doc = new PDFDocument({
            size: [595, 595],
            margins: {
              top: 54,
              bottom: 54,
              left: 54,
              right: 54,
            },
            bufferPages: true
          });
      
          let contadorPaginas = 0;
      
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename="TEA.pdf"');
          doc.pipe(res);
      
          // 4. Configurar Turndown
          const turndownService = turndown({
            headingStyle: 'atx',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced'
          });
      
          turndownService.addRule('nbsp', {
            filter: ['nbsp'],
            replacement: () => ' '
          });
      
          // 5. PORTADA COMPLETA
          doc.moveDown(3);
      
          doc.font(fontPath)
            .fontSize(18)
            .text('UNIVERSIDAD NACIONAL AUTÓNOMA DE MÉXICO', {
              align: 'right',
              paragraphGap: 10
            })
            .moveDown(1);
      
          doc.font(fontPath)
            .fontSize(11)
            .text('Programa de Maestría y Doctorado en Música', { align: 'right' })
            .text('Facultad de Música', { align: 'right' })
            .text('Instituto de Ciencias Aplicadas y Tecnología', { align: 'right' })
            .text('Instituto de Investigaciones Antropológicas', { align: 'right' })
            .moveDown(1);
      
          doc.font(fontPath)
            .fontSize(18)
            .text('TRES ESTUDIOS ABIERTOS', { align: 'right' })
            .moveDown(0.5);
      
          doc.font(fontPath)
            .fontSize(11)
            .text('Escritura de código en Javascript para el performance audiovisual y la investigación artística', {
              align: 'right',
              lineGap: 5
            })
            .moveDown(1);
      
          doc.font(fontPath)
            .fontSize(11)
            .text('Que para optar por el grado de', { align: 'right' })
            .moveDown(1);
      
          doc.font(fontPath)
            .fontSize(11)
            .text('Doctor en Música', { align: 'right' })
            .font(fontPath)
            .fontSize(11)
            .text('(Tecnología Musical)', { align: 'right' })
            .moveDown(1);
      
          doc.font(fontPath)
            .fontSize(11)
            .text('Presenta', { align: 'right' })
            .moveDown(1);
      
          doc.font(fontPath)
            .fontSize(14)
            .text('Emilio Ocelotl Reyes', { align: 'right' })
            .moveDown(1);
      
          doc.font(fontPath)
            .fontSize(12)
            .text('Tutor Principal: Hugo Solís', { align: 'right' })
            .text('Comité tutor: Iracema de Andrade y Fernando Monreal', { align: 'right' });
      
          // Añadir página nueva para el contenido
          doc.addPage();
      
          // 6. Separar capítulos (usando el root filtrado)
          const aclaracionesChapter = rootFiltrado.children?.find(ch =>
            ch.title && ch.title.trim().toLowerCase().includes('aclaraciones')
          );
          let remainingChapters = rootFiltrado.children?.filter(ch => ch !== aclaracionesChapter && ch.title && ch.title.toLowerCase() !== 'referencias') || [];
          let referencesNode = rootFiltrado.children?.find(ch => ch.title && ch.title.toLowerCase() === 'referencias');
      
          // 7. ÍNDICE - Solo con capítulos principales
          const capitulosParaIndice = [];
      
          if (aclaracionesChapter) {
            capitulosParaIndice.push(aclaracionesChapter);
          }
          capitulosParaIndice.push(...remainingChapters);
          if (referencesNode) {
            capitulosParaIndice.push(referencesNode);
          }
      
          console.log(`Capítulos para índice: ${capitulosParaIndice.length}`);
          console.log('Capítulos en índice:', capitulosParaIndice.map(c => c.title));
          
          insertarIndice(doc, capitulosParaIndice, fontPath);
      
          // 8. PROCESAR CONTENIDO JERÁRQUICO COMPLETO (usando el root filtrado)
          
          // Procesar aclaraciones primero si existe
          if (aclaracionesChapter) {
            console.log(`Procesando aclaraciones: ${aclaracionesChapter.title}`);
            contadorPaginas = procesarContenidoJerarquico(
              doc,
              aclaracionesChapter,
              turndownService,
              0, // nivel 0 (capítulo)
              contadorPaginas,
              fontPath
            );
          }
      
          // Procesar los demás capítulos
          for (const capitulo of remainingChapters) {
            console.log(`Procesando capítulo: ${capitulo.title}`);
            contadorPaginas = procesarContenidoJerarquico(
              doc,
              capitulo,
              turndownService,
              0, // nivel 0 (capítulo)
              contadorPaginas,
              fontPath
            );
          }
      
          // 9. REFERENCIAS al final
          if (referencesNode) {
            console.log(`Procesando referencias: ${referencesNode.title}`);
            contadorPaginas = procesarContenidoJerarquico(
              doc,
              referencesNode,
              turndownService,
              0, // nivel 0 (capítulo)
              contadorPaginas,
              fontPath
            );
          }
      
          doc.end();
          console.log('PDF generado exitosamente');
      
        } catch (err) {
          console.error('Error generando PDF:', err);
          if (!res.headersSent) {
            res.status(500).json({
              error: 'Error al generar el PDF',
              details: err.message
            });
          }
        } finally {
          if (db) {
            db.close((err) => {
              if (err) console.error('Error cerrando BD:', err);
            });
          }
        }
      });
      
      app.listen(port, () => {
        console.log(`Servidor corriendo en http://localhost:${port}`);
      });
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