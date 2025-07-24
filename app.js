import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import fs from 'fs';

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
    // Consultas a la base de datos
    const { notes, branches, note_contents } = await new Promise((resolve, reject) => {
      db.all(`SELECT noteId, title FROM notes WHERE isDeleted = 0`, [], (err, notes) => {
        if (err) return reject(err);
        db.all(`SELECT branchId, noteId, parentNoteId, notePosition FROM branches WHERE isDeleted = 0`, [], (err, branches) => {
          if (err) return reject(err);
          db.all(`SELECT noteId, content FROM note_contents`, [], (err, note_contents) => {
            if (err) return reject(err);
            resolve({ notes, branches, note_contents });
          });
        });
      });
    });

    // Procesamiento de datos
    const notesWithContent = notes.map(note => ({
      ...note,
      content: note_contents.find(nc => nc.noteId === note.noteId)?.content || ''
    }));

    const tree = buildTree(notesWithContent, branches);
    const root = findNodeByTitle(tree, 'Tres Estudios Abiertos');

    if (!root) {
      return res.status(404).send('No se encontró "Tres Estudios Abiertos"');
    }

    // Generar PDF en memoria
    const doc = new PDFDocument();
    
    // Configurar headers antes de escribir el PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Tres_Estudios_Abiertos.pdf"');
    
    // Pipe directo a la respuesta HTTP
    doc.pipe(res);

    // Contenido del PDF (usa la misma lógica que en generateTresEstudiosPDF)
    doc.font('Helvetica')
       .fontSize(18)
       .text('Tres Estudios Abiertos', { align: 'center', underline: true })
       .moveDown(0.5);

    let references = null;

    // Procesar capítulos
    root.children.forEach(capitulo => {
      if (capitulo.title.toLowerCase() === 'referencias') {
        references = capitulo;
        return;
      }

      doc.fontSize(14)
         .text(capitulo.title, { paragraphGap: 5, indent: 20 })
         .moveDown(0.3);

      capitulo.children.forEach(nota => {
        const contentPlain = nota.content?.replace(/<[^>]+>/g, '').trim() || '';
        doc.fontSize(12);
        
        if (contentPlain) {
          doc.text(contentPlain, { indent: 30, align: 'justify', paragraphGap: 5 });
        } else {
          doc.text(`- ${nota.title}`, { indent: 30 });
        }
        doc.moveDown(0.2);
      });
    });

    // Añadir referencias al final
    if (references) {
      doc.addPage()
         .fontSize(14)
         .text(references.title, { underline: true, paragraphGap: 5 });
      
      references.children.forEach(nota => {
        const contentPlain = nota.content?.replace(/<[^>]+>/g, '').trim() || '';
        doc.fontSize(12)
           .text(contentPlain || `- ${nota.title}`, { indent: 30 });
      });
    }

    // Finalizar el PDF
    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send('Error interno');
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

