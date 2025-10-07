// routes/threejs.js
import express from 'express';
import { NoteService } from '../services/noteService.js';

const router = express.Router();
const noteService = new NoteService();

// Función auxiliar para contar nodos (fuera de las rutas)
function countNodes(node) {
  let count = 1; // Contar el nodo actual
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      count += countNodes(child);
    });
  }
  return count;
}

// Endpoint principal para Three.js - estructura completa
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

// Endpoint para contenido de nota individual
router.get('/note/:id/content', async (req, res) => {
  try {
    const noteId = req.params.id;
    console.log(`Solicitando contenido para nota: ${noteId}`);
    
    // Por ahora retornamos un placeholder - luego implementaremos la lógica real
    const content = {
      id: noteId,
      title: `Nota ${noteId}`,
      content: 'Contenido de la nota...',
      type: 'note',
      lastModified: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: content
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

// Búsqueda para Three.js
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro de búsqueda requerido'
      });
    }
    
    console.log(`Búsqueda Three.js: "${query}"`);
    
    // Placeholder para búsqueda - implementaremos después
    const results = {
      query,
      results: [],
      count: 0
    };
    
    res.json({
      success: true,
      data: results
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

// Health check específico para Three.js
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Three.js API',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

export default router;