import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import turndown from 'turndown';
import imgData from './data/img.js';

const app = express();
const port = 3000;

app.use(cors());

const db = new sqlite3.Database('./document.db', sqlite3.OPEN_READONLY, (err) => {
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

function insertarIndice(doc, capitulos, fontPath) {
  doc.addPage(); // Página en blanco después de portada

  doc.font(fontPath)
    .fontSize(16)
    .text('ÍNDICE', {
      align: 'center',
      underline: true
    })
    .moveDown(1.5);

  for (const capitulo of capitulos) {
    // Línea del capítulo principal
    doc.font(fontPath)
      .fontSize(12)
      .text(capitulo.title, {
        indent: 0,
        continued: false
      });

    // Subcapítulos (notas hijas con título, si hay)
    if (capitulo.children?.length) {
      for (const sub of capitulo.children) {
        if (sub.title && sub.title.trim() !== '') {
          doc.font(fontPath)
            .fontSize(10)
            .fillColor('#444')
            .text(`- ${sub.title}`, {
              indent: 20
            });
        }
      }
    }

    doc.moveDown(0.5);
  }

  doc.moveDown(2);
}


const insertarPaginaGaleria = (doc, imagen) => {
  try {
    doc.addPage();

    // Configuración de márgenes (reducidos para maximizar espacio)
    const margenSuperior = 30;
    const margenInferior = 30;
    const margenLateral = 54;

    // Dimensiones disponibles
    const anchoDisponible = doc.page.width - (margenLateral * 2);
    const altoDisponible = doc.page.height - margenSuperior - margenInferior;

    // 1. Precalcular espacio para el pie de foto (mínimo 4 líneas)
    let textoPie = '';
    let alturaPie = 0;

    if (imagen.nota || imagen.titulo) {
      textoPie = imagen.titulo ? `${imagen.titulo}. ${imagen.nota || ''}` : imagen.nota;
      alturaPie = Math.max(
        doc.font('fonts/SpaceGrotesk.ttf').fontSize(9).heightOfString(textoPie, { width: anchoDisponible }),
        9 * 4 // Mínimo espacio para 4 líneas
      );
    }

    // 2. Cargar imagen y analizar proporciones
    const img = doc.openImage(imagen.img);
    const esVertical = img.height > img.width * 1.2; // Si es 20% más alta que ancha
    const esCuadrada = Math.abs(img.width - img.height) < img.width * 0.1; // ±10%

    // 3. Ajustar estrategia según tipo de imagen
    let imgWidth, imgHeight;

    if (esVertical) {
      // Para imágenes verticales: limitar altura y centrar
      const ratio = Math.min(
        anchoDisponible / img.width,
        (altoDisponible * 0.7) / img.height // Usar solo 70% del alto disponible
      );
      imgWidth = img.width * ratio;
      imgHeight = img.height * ratio;
    } else if (esCuadrada) {
      // Para imágenes cuadradas: usar 80% del espacio menor
      const espacioDisponible = Math.min(anchoDisponible, altoDisponible - alturaPie) * 0.8;
      const ratio = espacioDisponible / Math.max(img.width, img.height);
      imgWidth = img.width * ratio;
      imgHeight = img.height * ratio;
    } else {
      // Para horizontales: comportamiento normal
      const ratio = Math.min(
        anchoDisponible / img.width,
        (altoDisponible - alturaPie) / img.height
      );
      imgWidth = img.width * ratio;
      imgHeight = img.height * ratio;
    }

    // 4. Calcular posición centrada con espacio garantizado para el pie
    const espacioLibreVertical = doc.page.height - margenSuperior - imgHeight - alturaPie - margenInferior;
    const yImagen = margenSuperior + Math.max(0, espacioLibreVertical / 2);

    // 5. Dibujar imagen
    const xImagen = margenLateral + (anchoDisponible - imgWidth) / 2;
    doc.image(imagen.img, xImagen, yImagen, {
      width: imgWidth,
      height: imgHeight
    });

    // 6. Pie de foto con posición asegurada
    if (textoPie) {
      const yTexto = Math.min(
        yImagen + imgHeight + 10,
        doc.page.height - margenInferior - alturaPie
      );

      doc.font('fonts/SpaceGrotesk.ttf')
        .fontSize(9)
        .fillColor('#555555')
        .text(textoPie, margenLateral, yTexto, {
          width: anchoDisponible,
          align: 'center'
        });
    }

  } catch (err) {
    console.error(`Error al insertar imagen ${imagen.img}:`, err);
  }
};

function processAclaracionesChapter(doc, chapter, turndownService, imagenesDisponibles, contadorPaginas) {
  if (!chapter) return contadorPaginas;

  // Configuración de página para el capítulo de aclaraciones
  doc.addPage();

  // Título del capítulo
  doc.font('fonts/SpaceGrotesk.ttf')
    .fontSize(16)
    .text(chapter.title.toUpperCase(), {
      align: 'center',
      paragraphGap: 20
    });

  // Contenido del capítulo
  for (const nota of chapter.children) {
    if (nota.content) {
      const markdown = turndownService.turndown(nota.content);

      // Insertar imágenes si corresponde
      if (contadorPaginas % 2 === 0 && imagenesDisponibles.length > 0) {
        const imagenSeleccionada = imagenesDisponibles.shift();
        insertarPaginaGaleria(doc, imagenSeleccionada);
        contadorPaginas++;
        doc.addPage();
      }

      // Texto principal
      doc.font('fonts/SpaceGrotesk.ttf')
        .fontSize(11)
        .text(markdown, {
          indent: 10,
          paragraphGap: 5,
          lineGap: 3
        });
    } else {
      doc.text(`- ${nota.title}`, { indent: 30 });
    }

    doc.moveDown(0.3);
    contadorPaginas++;
  }

  doc.addPage();
  return contadorPaginas;
}

app.get('/api/pdf', async (req, res) => {
  try {
    // 1. Consultas a la base de datos
    const { notes, branches, note_contents } = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database('./document.db');

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

    // 3. Configuración del PDF
    const doc = new PDFDocument({
      size: [595, 595],
      margins: {
        top: 54,
        bottom: 54,
        left: 54,
        right: 54,
      },
      // layout: 'portrait',
      bufferPages: true
    });

    // Variables para control de imágenes
    const imagenesDisponibles = [...imgData.title, ...imgData.imgs];
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

    doc.font('fonts/SpaceGrotesk.ttf')
      .fontSize(18)
      .text('UNIVERSIDAD NACIONAL AUTÓNOMA DE MÉXICO', {
        align: 'right',
        paragraphGap: 10
      })
      .moveDown(1);

    doc.font('fonts/SpaceGrotesk.ttf')
      .fontSize(11)
      .text('Programa de Maestría y Doctorado en Música', { align: 'right' })
      .text('Facultad de Música', { align: 'right' })
      .text('Instituto de Ciencias Aplicadas y Tecnología', { align: 'right' })
      .text('Instituto de Investigaciones Antropológicas', { align: 'right' })
      .moveDown(1);

    doc.font('fonts/SpaceGrotesk.ttf')
      .fontSize(18)
      .text('TRES ESTUDIOS ABIERTOS', { align: 'right' })
      .moveDown(0.5);

    doc.font('fonts/SpaceGrotesk.ttf')
      .fontSize(11)
      .text('Escritura de código en Javascript para el performance audiovisual y la investigación artística', {
        align: 'right',
        lineGap: 5
      })
      .moveDown(1);

    doc.font('fonts/SpaceGrotesk.ttf')
      .fontSize(11)
      .text('Que para optar por el grado de', { align: 'right' })
      .moveDown(1);

    doc.font('fonts/SpaceGrotesk.ttf')
      .fontSize(11)
      .text('Doctor en Música', { align: 'right' })
      .font('fonts/SpaceGrotesk.ttf')
      .fontSize(11)
      .text('(Tecnología Musical)', { align: 'right' })
      .moveDown(1);

    doc.font('fonts/SpaceGrotesk.ttf')
      .fontSize(11)
      .text('Presenta', { align: 'right' })
      .moveDown(1);

    doc.font('fonts/SpaceGrotesk.ttf')
      .fontSize(14)
      .text('Emilio Ocelotl Reyes', { align: 'right' })
      .moveDown(1);

    doc.font('fonts/SpaceGrotesk.ttf')
      .fontSize(12)
      .text('Tutor Principal: Hugo Solís', { align: 'right' })
      .text('Comité tutor: Iracema de Andrade y Fernando Monreal', { align: 'right' });

    // Añadir página nueva para el contenido
    doc.addPage();

    // 6. Procesar primero el capítulo de aclaraciones (si cambia eliminar esto y descomentar abajo)
    const aclaracionesChapter = root.children.find(ch =>
      ch.title.trim().toLowerCase().includes('1.0 aclaraciones para leer este documento')
    ); let remainingChapters = root.children.filter(ch => ch !== aclaracionesChapter && ch.title.toLowerCase() !== 'referencias');
    let referencesNode = root.children.find(ch => ch.title.toLowerCase() === 'referencias');

    // Procesar aclaraciones justo después de la portada
    if (aclaracionesChapter) {
      contadorPaginas = processAclaracionesChapter(
        doc,
        aclaracionesChapter,
        turndownService,
        imagenesDisponibles,
        contadorPaginas
      );
    }

    doc.addPage(); // Hoja en blanco (puedes omitir si ya está incluida)

    // 7. Índice
    const capitulosParaIndice = [];

    if (aclaracionesChapter) {
      capitulosParaIndice.push(aclaracionesChapter);
    }
    capitulosParaIndice.push(...remainingChapters);
    if (referencesNode) {
      capitulosParaIndice.push(referencesNode);
    }
    console.log('Capítulos para el índice:', capitulosParaIndice.map(c => c.title));
    capitulosParaIndice.forEach(c => {
      console.log(`Capítulo: ${c.title}, hijos: ${c.children?.length || 0}`);
    });

    insertarIndice(doc, capitulosParaIndice, 'fonts/SpaceGrotesk.ttf');

    // 7. Procesar contenido
    // let referencesNode = null;

    for (const capitulo of remainingChapters) { // root.children y la linea anterior si aclaraciones cambia de lugar
      if (capitulo.title.toLowerCase() === 'referencias') {
        referencesNode = capitulo;
        continue;
      }


      const chapterTitle = capitulo.title.toUpperCase(); // Space Grotesk funciona mejor en mayúsculas
      const titleHeight = 18 * 1.2; // fontSize * lineHeight aproximado

      // Calcular posición Y para centrado vertical
      const centerY = (doc.page.height - titleHeight) / 2;

      doc.font('fonts/SpaceGrotesk.ttf')
        .fontSize(18)
        .text(chapterTitle, {
          align: 'center',
          y: centerY // Posición vertical calculada
        });

      // Espacio después del título (opcional)
      doc.moveDown(2);

      // Resetear posición para contenido
      doc.y = centerY + titleHeight + 40;
      doc.addPage();

      // Contenido de notas
      for (const nota of capitulo.children) {
        if (nota.content) {
          const markdown = turndownService.turndown(nota.content);

          // 1. Primero verifica si debe insertar imagen ANTES del texto
          if (contadorPaginas % 2 === 0 && imagenesDisponibles.length > 0) {
            const imagenSeleccionada = imagenesDisponibles.shift();
            insertarPaginaGaleria(doc, imagenSeleccionada);
            contadorPaginas++; // Contar la página de imagen
            doc.addPage(); // Nueva página para el texto que sigue
          }

          // 2. Luego escribe el texto
          doc.font('fonts/SpaceGrotesk.ttf')
            .fontSize(11)
            .text(markdown, {
              indent: 10,
              paragraphGap: 5
            });
        } else {
          doc.text(`- ${nota.title}`, { indent: 30 });
        }

        doc.moveDown(0.3);
        contadorPaginas++;
      }

      doc.addPage();
    }

    // 7. Referencias al final
    if (referencesNode) {
      doc.addPage()
        .font('fonts/SpaceGrotesk.ttf')
        .fontSize(18)
        .text('Referencias')
        .moveDown(0.5);

      for (const nota of referencesNode.children) {
        const content = nota.content
          ? turndownService.turndown(nota.content)
          : `- ${nota.title}`;

        doc.font('fonts/SpaceGrotesk.ttf')
          .fontSize(11)
          .text(content, { indent: 20 })
          .moveDown(0.2);
      }
    }

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