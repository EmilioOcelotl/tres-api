import express from 'express';
import sqlite3 from 'sqlite3';

const app = express();
const port = 3000;

const db = new sqlite3.Database('./notas.sqlite', sqlite3.OPEN_READONLY, (err) => {
  if (err) console.error('Error al abrir base:', err.message);
  else console.log('Base de datos conectada');
});

app.get('/api/text', (req, res) => {
  const query = `
    SELECT
      b.noteId,
      b.parentNoteId,
      b.notePosition,
      n.title
    FROM branches b
    LEFT JOIN notes n ON b.noteId = n.noteId
    WHERE n.isDeleted = 0
    ORDER BY b.parentNoteId, b.notePosition;
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener jerarquía:', err.message);
      return res.status(500).send('Error al obtener jerarquía');
    }

    // Armar un mapa para acceder nodos por id
    const nodesById = {};
    rows.forEach(row => {
      nodesById[row.noteId] = { ...row, children: [] };
    });

    // Armar el árbol
    const rootNodes = [];
    rows.forEach(row => {
      if (!row.parentNoteId || !nodesById[row.parentNoteId]) {
        rootNodes.push(nodesById[row.noteId]);
      } else {
        nodesById[row.parentNoteId].children.push(nodesById[row.noteId]);
      }
    });

    // Función para renderizar árbol en texto plano con sangría
    function renderText(nodes, depth = 0) {
      let text = '';
      nodes.forEach(node => {
        text += '  '.repeat(depth) + '- ' + (node.title || '[Sin título]') + '\n';
        if (node.children.length) {
          text += renderText(node.children, depth + 1);
        }
      });
      return text;
    }

    const output = renderText(rootNodes);

    res.type('text/plain').send(output);
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
