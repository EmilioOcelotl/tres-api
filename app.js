import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import PDFDocument from 'pdfkit';
import turndown from 'turndown';
// import imgData from './data/img.js'; // Comentamos la importación de imágenes

const app = express();
const port = 3000;

app.use(cors());

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

// Comentamos la función de galería temporalmente
/*
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
*/

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
function procesarContenidoJerarquico(doc, nodo, turndownService, nivel = 0, contadorPaginas) {
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
      doc.font('fonts/SpaceGrotesk.ttf')
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
      
      doc.font('fonts/SpaceGrotesk.ttf')
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
      
      doc.font('fonts/SpaceGrotesk.ttf')
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
    
    // QUITAMOS LA INSERCIÓN DE IMÁGENES TEMPORALMENTE
    /*
    if (contadorPaginas % 2 === 0 && imagenesDisponibles.length > 0) {
      const imagenSeleccionada = imagenesDisponibles.shift();
      insertarPaginaGaleria(doc, imagenSeleccionada);
      contadorPaginas++;
      doc.addPage();
    }
    */

    // Para contenido que no es título, aplicar el formato normal
    if (!isTitle) {
      doc.font('fonts/SpaceGrotesk.ttf')
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
        doc.font('fonts/SpaceGrotesk.ttf')
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
        contadorPaginas
      );
    }
  }

  return contadorPaginas;
}

app.get('/api/pdf', async (req, res) => {
  let db;
  try {
    // 1. Consultas a la base de datos - USANDO LA ESTRUCTURA CORRECTA
    const result = await new Promise((resolve, reject) => {
      db = new sqlite3.Database('./loving_kepler.db', sqlite3.OPEN_READONLY, (err) => {
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

    // Variables para control - QUITAMOS LAS IMÁGENES TEMPORALMENTE
    // const imagenesDisponibles = [...imgData.title, ...imgData.imgs];
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
    
    insertarIndice(doc, capitulosParaIndice, 'fonts/SpaceGrotesk.ttf');

    // 8. PROCESAR CONTENIDO JERÁRQUICO COMPLETO (usando el root filtrado)
    
    // Procesar aclaraciones primero si existe
    if (aclaracionesChapter) {
      console.log(`Procesando aclaraciones: ${aclaracionesChapter.title}`);
      contadorPaginas = procesarContenidoJerarquico(
        doc,
        aclaracionesChapter,
        turndownService,
        0, // nivel 0 (capítulo)
        contadorPaginas
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
        contadorPaginas
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
        contadorPaginas
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