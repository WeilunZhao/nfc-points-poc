const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.sqlite');

async function init() {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      nfc_token TEXT UNIQUE,
      points INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS points_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      change_amount INTEGER,
      action_type TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.close();
}

async function getDb() {
  return open({ filename: DB_PATH, driver: sqlite3.Database });
}

async function createUser(name) {
  const db = await getDb();
  const result = await db.run('INSERT INTO users (name) VALUES (?)', [name]);
  const user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
  await db.close();
  return user;
}

async function bindTokenToUser(token, userId) {
  const db = await getDb();
  await db.run('UPDATE users SET nfc_token = ? WHERE id = ?', [token, userId]);
  await db.close();
}

async function findUserByToken(token) {
  const db = await getDb();
  const user = await db.get('SELECT * FROM users WHERE nfc_token = ?', [token]);
  await db.close();
  return user;
}

async function getUser(userId) {
  const db = await getDb();
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  await db.close();
  return user;
}

async function changePoints(userId, amount, action_type, description) {
  const db = await getDb();
  await db.run('UPDATE users SET points = points + ? WHERE id = ?', [amount, userId]);
  await db.run('INSERT INTO points_log (user_id, change_amount, action_type, description) VALUES (?,?,?,?)',
    [userId, amount, action_type, description]);
  await db.close();
}

async function getLogsForUser(userId) {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM points_log WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  await db.close();
  return rows;
}

module.exports = {
  init,
  createUser,
  bindTokenToUser,
  findUserByToken,
  getUser,
  changePoints,
  getLogsForUser
};
