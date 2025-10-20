// routes/threejs.js
import express from 'express';
import { NoteService } from '../services/noteService.js';
import { findNodeById } from '../utils/treeBuilder.js';

const router = express.Router();
const noteService = new NoteService();

// Función auxiliar para contar nodos (para logs)
function countNodes(node) {
  let count = 1;
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      count += countNodes(child);
    });
  }
  return count;
}

// 1️⃣ Endpoint principal para Three.js - estructura completa
router.get('/structure', async (req, res) => {
  try {
    console.log('Solicitando estructura para Three.js...');
    const structure = await noteService.getStructureForThreeJS();
    console.log(`Estructura generada: ${countNodes(structure)} nodos`);

    res.json({
      success: true,
      data: structure,
      metadata: {
        totalNodes: countNodes(structure),
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting 3D structure:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la estructura 3D',
      details: error.message
    });
  }
});

// 2️⃣ Endpoint para contenido de nota individual
router.get('/note/:id/content', async (req, res) => {
  try {
    const noteId = req.params.id;
    console.log(`Solicitando contenido para nota: ${noteId}`);

    const tree = await noteService.getCompleteTree();
    const node = findNodeById(tree, noteId);

    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Nota no encontrada'
      });
    }

    // Devolver contenido completo
    res.json({
      success: true,
      data: {
        id: node.noteId,
        title: node.title,
        content: node.content || '',
        type: 'note',
        lastModified: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting note content:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el contenido de la nota',
      details: error.message
    });
  }
});

// 3️⃣ Búsqueda para Three.js por título (case-insensitive)
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase();
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro de búsqueda requerido'
      });
    }

    const tree = await noteService.getCompleteTree();
    const results = [];

    function searchNode(node) {
      if (node.title.toLowerCase().includes(query)) {
        results.push({
          id: node.noteId,
          title: node.title,
          type: 'note'
        });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach(searchNode);
      }
    }

    searchNode(tree);

    res.json({
      success: true,
      data: {
        query,
        results,
        count: results.length
      }
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      error: 'Error en la búsqueda',
      details: error.message
    });
  }
});

// 4️⃣ Health check específico para Three.js
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Three.js API',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

export default router;
