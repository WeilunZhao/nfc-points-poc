const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const SECRET = process.env.SECRET_KEY || 'replace_this_with_a_strong_random_key';

// Utilities
function hmacToken(userId, nonce) {
  return crypto.createHmac('sha256', SECRET).update(userId + '|' + nonce).digest('hex');
}

// Register user (simple)
app.post('/user/create', async (req, res) => {
  const { name } = req.body;
  if(!name) return res.status(400).json({ error: 'name required' });
  const user = await db.createUser(name);
  res.json(user);
});

// Generate and bind token to user (admin action)
app.post('/nfc/register', async (req, res) => {
  const { userId, nonce } = req.body;
  if(!userId) return res.status(400).json({ error: 'userId required' });
  const n = nonce || (Date.now().toString());
  const token = hmacToken(String(userId), String(n));
  await db.bindTokenToUser(token, userId);
  res.json({ token, nonce: n });
});

// Scan endpoint (called by POS or mobile)
app.post('/nfc/scan', async (req, res) => {
  const { token, action, amount } = req.body;
  if(!token) return res.status(400).json({ error: 'token required' });
  const record = await db.findUserByToken(token);
  if(!record) return res.status(404).json({ error: 'token not bound' });
  // verify HMAC structure optionally (PoC assumes token was generated via /nfc/register)
  const userId = record.id;
  const change = parseInt(amount || 1, 10);
  if(action === 'add') {
    await db.changePoints(userId, change, 'add', 'NFC scan');
    return res.json({ ok: true, userId, change });
  } else if(action === 'redeem') {
    await db.changePoints(userId, -Math.abs(change), 'redeem', 'NFC redeem');
    return res.json({ ok: true, userId, change: -Math.abs(change) });
  } else {
    return res.status(400).json({ error: 'invalid action' });
  }
});

app.get('/points/:userId', async (req, res) => {
  const user = await db.getUser(req.params.userId);
  if(!user) return res.status(404).json({ error: 'no user' });
  const logs = await db.getLogsForUser(user.id);
  res.json({ user, logs });
});

app.post('/admin/points', async (req, res) => {
  const { userId, amount, description } = req.body;
  if(!userId || typeof amount === 'undefined') return res.status(400).json({ error: 'userId and amount required' });
  await db.changePoints(userId, parseInt(amount,10), 'admin', description || 'admin adjust');
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
db.init().then(()=> {
  app.listen(PORT, ()=> console.log('Server started on', PORT));
}).catch(err => {
  console.error('DB init failed', err);
  process.exit(1);
});
