// controllers/notasController.js
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./loving_kepler.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) console.error('Error al abrir la base:', err.message);
  else console.log('Base de datos conectada desde notasController');
});

export function getAllNotas(req, res) {
  const query = `
    SELECT notes.noteId, notes.title, notes.utcDateModified, note_contents.content
    FROM notes
    LEFT JOIN note_contents ON notes.noteId = note_contents.noteId
    WHERE notes.isDeleted = 0
    ORDER BY notes.utcDateModified DESC
    LIMIT 50;
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener notas:', err.message);
      res.status(500).json({ error: 'Error al leer la base de datos' });
    } else {
      res.json(rows);
    }
  });
}

export function getNotaById(req, res) {
  const noteId = req.params.id;

  const query = `
    SELECT notes.noteId, notes.title, notes.utcDateModified, note_contents.content
    FROM notes
    LEFT JOIN note_contents ON notes.noteId = note_contents.noteId
    WHERE notes.noteId = ? AND notes.isDeleted = 0;
  `;

  db.get(query, [noteId], (err, row) => {
    if (err) {
      console.error('Error al obtener la nota:', err.message);
      res.status(500).json({ error: 'Error al leer la base de datos' });
    } else if (!row) {
      res.status(404).json({ error: 'Nota no encontrada' });
    } else {
      res.json(row);
    }
  });
}
