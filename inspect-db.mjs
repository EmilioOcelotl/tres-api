import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
    filename: './notas.sqlite',
    driver: sqlite3.Database
  });
  
  // Mostrar tablas
  const tables = await db.all(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%';
  `);
  
  console.log("Tablas en la base de datos:");
  for (const table of tables) {
    console.log(`- ${table.name}`);
    const columns = await db.all(`PRAGMA table_info(${table.name});`);
    console.log("  Columnas:");
    columns.forEach(col => {
      console.log(`    ${col.name} (${col.type})`);
    });
  }