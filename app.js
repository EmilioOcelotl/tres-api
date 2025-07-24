import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import turndown from 'turndown';

const app = express();
const port = 3000;

app.use(cors());

const db = new sqlite3.Database('./notas.sqlite', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error abriendo la base:', err.message);
  } else {
    console.log('Base de datos conectada correctamente');
  }
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

function generateTresEstudiosPDF(node, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    
    doc.pipe(stream);

    // Configuración inicial
    doc.font('Helvetica');
    doc.fontSize(12);
    doc.text('Tres Estudios Abiertos', {
      align: 'center',
      underline: true,
      fontSize: 18,
      margin: [0, 0, 0, 20]
    });

    let references = null;

    // Procesar contenido
    node.children.forEach(capitulo => {
      if (capitulo.title.toLowerCase() === 'referencias') {
        references = capitulo; // Guardar para el final
        return;
      }

      // Estilo para capítulos
      doc.fontSize(14);
      doc.text(capitulo.title, {
        paragraphGap: 5,
        indent: 20,
        continued: false
      });

      // Procesar notas del capítulo
      capitulo.children.forEach(nota => {
        const contentPlain = nota.content ? nota.content.replace(/<[^>]+>/g, '').trim() : '';
        
        doc.fontSize(12);
        if (contentPlain) {
          doc.text(contentPlain, {
            paragraphGap: 10,
            indent: 30,
            align: 'justify'
          });
        } else {
          doc.text(`- ${nota.title}`, {
            indent: 30
          });
        }
      });
    });

    // Añadir referencias al final
    if (references) {
      doc.addPage(); // Opcional: nueva página para referencias
      doc.fontSize(14);
      doc.text(references.title, {
        paragraphGap: 5,
        indent: 20,
        underline: true
      });

      references.children.forEach(nota => {
        const contentPlain = nota.content ? nota.content.replace(/<[^>]+>/g, '').trim() : '';
        doc.fontSize(12);
        doc.text(contentPlain || `- ${nota.title}`, {
          indent: 30,
          paragraphGap: 5
        });
      });
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

app.get('/api/pdf', async (req, res) => {
  try {
    // 1. Consultas a la base de datos
    const { notes, branches, note_contents } = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('./notas.sqlite');
      
      db.all(`SELECT noteId, title FROM notes WHERE isDeleted = 0`, [], (err, notes) => {
        if (err) return reject(err);
        
        db.all(`SELECT branchId, noteId, parentNoteId, notePosition FROM branches WHERE isDeleted = 0`, [], (err, branches) => {
          if (err) return reject(err);
          
          db.all(`SELECT noteId, content FROM note_contents`, [], (err, note_contents) => {
            db.close();
            if (err) return reject(err);
            resolve({ notes, branches, note_contents });
          });
        });
      });
    });

    // 2. Procesar datos
    const notesWithContent = notes.map(note => ({
      ...note,
      content: note_contents.find(nc => nc.noteId === note.noteId)?.content || ''
    }));

    const tree = buildTree(notesWithContent, branches);
    const root = findNodeByTitle(tree, 'Tres Estudios Abiertos');

    if (!root) {
      return res.status(404).json({ error: 'No se encontró "Tres Estudios Abiertos"' });
    }

    // 3. Configurar PDF
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Configurar respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Tres_Estudios_Abiertos.pdf"');
    doc.pipe(res);

    // 4. Configurar Turndown (versión compatible)
    const turndownService = turndown({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced'
    });

    // Regla para espacios no rompibles
    turndownService.addRule('nbsp', {
      filter: ['nbsp'],
      replacement: () => ' '
    });

    // 5. Portada
    doc.font('Helvetica-Bold')
       .fontSize(22)
       .text('Tres Estudios Abiertos', { align: 'center' })
       .moveDown(1.5);

    // 6. Procesar contenido
    let referencesNode = null;

    for (const capitulo of root.children) {
      if (capitulo.title.toLowerCase() === 'referencias') {
        referencesNode = capitulo;
        continue;
      }

      // Título del capítulo
      doc.font('Helvetica-Bold')
         .fontSize(18)
         .text(capitulo.title)
         .moveDown(0.5);

      // Contenido de notas
      for (const nota of capitulo.children) {
        if (nota.content) {
          const markdown = turndownService.turndown(nota.content);
          doc.font('Helvetica')
             .fontSize(12)
             .text(markdown, {
               indent: 20,
               align: 'justify',
               paragraphGap: 5
             });
        } else {
          doc.text(`- ${nota.title}`, { indent: 30 });
        }
        doc.moveDown(0.3);
      }
    }

    // 7. Referencias al final
    if (referencesNode) {
      doc.addPage()
         .font('Helvetica-Bold')
         .fontSize(18)
         .text('Referencias')
         .moveDown(0.5);

      for (const nota of referencesNode.children) {
        const content = nota.content 
          ? turndownService.turndown(nota.content)
          : `- ${nota.title}`;
        
        doc.font('Helvetica')
           .fontSize(12)
           .text(content, { indent: 20 })
           .moveDown(0.2);
      }
    }

    // Finalizar documento
    doc.end();

  } catch (err) {
    console.error('Error generando PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Error al generar el PDF',
        details: err.message 
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

