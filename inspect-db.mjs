import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function openDB() {
  return open({ filename: './loving_kepler.db', driver: sqlite3.Database });
}

// Función para extraer un extracto del contenido
function getContentExcerpt(content, maxLength = 100) {
  if (!content) return '(sin contenido)';
  
  try {
    // Si el contenido es un Buffer, convertirlo a string
    let text = content;
    if (Buffer.isBuffer(content)) {
      text = content.toString('utf8');
    }
    
    // Limpiar HTML tags si es necesario y obtener texto plano
    let plainText = text
      .replace(/<[^>]*>/g, ' ') // Eliminar tags HTML
      .replace(/\s+/g, ' ')     // Normalizar espacios
      .trim();
    
    // Si después de limpiar está vacío
    if (!plainText) return '(sin contenido)';
    
    // Cortar al máximo de caracteres y agregar "..." si es necesario
    if (plainText.length > maxLength) {
      return plainText.substring(0, maxLength) + '...';
    }
    
    return plainText;
  } catch (error) {
    return '(error al leer contenido)';
  }
}

async function main() {
  const db = await openDB();

  // 1. Obtener notas con contenido
  const notes = await db.all(`
    SELECT n.noteId, n.title, b.content
    FROM notes n
    LEFT JOIN blobs b ON n.blobId = b.blobId
    WHERE n.isDeleted = 0
  `);

  // 2. Obtener branches
  const branches = await db.all(`
    SELECT branchId, noteId, parentNoteId, notePosition
    FROM branches
    WHERE isDeleted = 0
  `);

  await db.close();

  // 3. Mapas para acceso rápido
  const noteMap = new Map(notes.map(n => [n.noteId, { ...n, children: [] }]));
  const childrenMap = new Map(); // parentNoteId -> [childNodes]

  branches.forEach(b => {
    if (!noteMap.has(b.noteId)) return;
    if (!b.parentNoteId) return;
    if (!childrenMap.has(b.parentNoteId)) childrenMap.set(b.parentNoteId, []);
    childrenMap.get(b.parentNoteId).push(noteMap.get(b.noteId));
  });

  // 4. Asignar hijos ordenados por notePosition
  childrenMap.forEach((children, parentId) => {
    children.sort((a, b) => {
      const aPos = branches.find(bc => bc.noteId === a.noteId)?.notePosition || 0;
      const bPos = branches.find(bc => bc.noteId === b.noteId)?.notePosition || 0;
      return aPos - bPos;
    });
    if (noteMap.has(parentId)) noteMap.get(parentId).children = children;
  });

  // 5. Encontrar raíz "Tres"
  const root = notes.find(n => n.title === 'Tres');
  if (!root) return console.log('No se encontró la nota raíz "Tres"');

  // 6. Función recursiva para imprimir con extractos
  function printNode(node, indent = '') {
    // Si encontramos "Hidden Notes", no imprimimos nada de este nodo
    if (node.title === 'Hidden Notes') {
      return;
    }
    
    // Imprimir título y extracto del contenido
    const excerpt = getContentExcerpt(node.content);
    console.log(indent + '- ' + node.title);
    console.log(indent + '  ' + excerpt);
    
    if (node.children?.length) {
      node.children.forEach(child => printNode(child, indent + '  '));
    }
  }

  console.log('--- Árbol jerárquico con extractos ---');
  printNode(noteMap.get(root.noteId));
}

main().catch(err => console.error(err));
