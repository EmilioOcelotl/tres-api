// config/database.js
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databasePath = path.join(__dirname, '..', 'database', 'loving_kepler.db');

export function getDatabase() {
  return new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
}

export { databasePath };