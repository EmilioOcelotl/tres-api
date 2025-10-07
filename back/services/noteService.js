// services/noteService.js
import { getDatabase } from '../config/database.js';
import { buildTree, findNodeByTitle, filtrarHiddenNotes } from '../utils/treeBuilder.js';

export class NoteService {
  async getNotesAndBranches() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
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
            
            // Cerrar la conexión después de usar
            db.close((closeErr) => {
              if (closeErr) console.error('Error cerrando BD:', closeErr);
            });
          });
        });
      });
    });
  }

  async getCompleteTree() {
    try {
      const { notes, branches } = await this.getNotesAndBranches();
      
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
        throw new Error('No se encontró la nota raíz "Tres"');
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
      
      return rootFiltrado;
      
    } catch (error) {
      console.error('Error en getCompleteTree:', error);
      throw error;
    }
  }

  // Nuevo método específico para Three.js
  async getStructureForThreeJS() {
    const root = await this.getCompleteTree();
    
    // Transformar el árbol a formato optimizado para 3D
    return this.transformToThreeJSStructure(root);
  }
  
  transformToThreeJSStructure(node, level = 0) {
    const nodeType = this.determineNodeType(level);
    
    return {
      id: node.noteId,
      title: node.title,
      type: nodeType,
      content: node.content ? this.extractContentPreview(node.content) : '',
      children: node.children?.map(child => 
        this.transformToThreeJSStructure(child, level + 1)
      ) || []
    };
  }
  
  determineNodeType(level) {
    const types = ['chapter', 'subchapter', 'note'];
    return types[level] || 'note';
  }
  
  extractContentPreview(content) {
    // Convertir el contenido a string si es un Buffer
    const contentStr = Buffer.isBuffer(content) ? content.toString('utf8') : content;
    
    // Extraer un preview del contenido (primeros 200 caracteres)
    return contentStr.substring(0, 200) + (contentStr.length > 200 ? '...' : '');
  }
}