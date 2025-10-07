// utils/treeBuilder.js

// Función para construir árbol jerárquico a partir de notas y ramas (branches)
export function buildTree(notes, branches) {
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
  export function findNodeByTitle(nodes, title) {
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
  
  // Función para filtrar nodos "Hidden Notes" y sus hijos
  export function filtrarHiddenNotes(nodo) {
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