const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const { Telegraf } = require('telegraf');

// ⚠️ Seedha yaha daala hua hai — is repo ko PRIVATE rakhna,
// warna ye token kisi aur ke haath lag sakta hai aur wo tera bot control kar lega.
const BOT_TOKEN = "8560742869:AAHZfaOW3huN_J-VyMpMzGU8bUt6VL_Ab2U";
const ADMIN_CHAT_ID = "6683763984";
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);
const db = new Database(path.join(__dirname, 'chat.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  code TEXT PRIMARY KEY,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT,
  sender TEXT,
  text TEXT,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS tg_message_map (
  tg_message_id INTEGER PRIMARY KEY,
  code TEXT
);
`);

function genCode() {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `SP$${rand}`;
}

function codeExists(code) {
  return !!db.prepare('SELECT 1 FROM sessions WHERE code = ?').get(code);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/session/new', (req, res) => {
  let code;
  do { code = genCode(); } while (codeExists(code));
  db.prepare('INSERT INTO sessions (code, created_at) VALUES (?, ?)').run(code, Date.now());
  res.json({ code });
});

app.get('/api/session/:code/verify', (req, res) => {
  res.json({ valid: codeExists(req.params.code) });
});

app.get('/api/session/:code/messages', (req, res) => {
  if (!codeExists(req.params.code)) return res.status(404).json({ error: 'Invalid code' });
  const rows = db.prepare(
    'SELECT sender, text, created_at FROM messages WHERE code = ? ORDER BY id ASC'
  ).all(req.params.code);
  res.json({ messages: rows });
});

app.post('/api/session/:code/message', async (req, res) => {
  const { code } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Empty message' });
  if (!codeExists(code)) return res.status(404).json({ error: 'Invalid code' });

  db.prepare('INSERT INTO messages (code, sender, text, created_at) VALUES (?, ?, ?, ?)')
    .run(code, 'user', text.trim(), Date.now());

  if (ADMIN_CHAT_ID) {
    try {
      const sent = await bot.telegram.sendMessage(ADMIN_CHAT_ID, `\uD83D\uDCAC [${code}]\n${text.trim()}`);
      db.prepare('INSERT OR REPLACE INTO tg_message_map (tg_message_id, code) VALUES (?, ?)')
        .run(sent.message_id, code);
    } catch (e) {
      console.error('Telegram forward failed:', e.message);
    }
  }

  res.json({ ok: true });
});

bot.on('message', (ctx) => {
  const msg = ctx.message;

  if (msg.text === '/start') {
    return ctx.reply(`Tera Telegram chat ID hai: ${ctx.chat.id}`);
  }

  if (!ADMIN_CHAT_ID || String(ctx.chat.id) !== String(ADMIN_CHAT_ID)) return;

  if (msg.text === '/active') {
    const rows = db.prepare(
      'SELECT code, created_at FROM sessions ORDER BY created_at DESC LIMIT 20'
    ).all();
    if (!rows.length) return ctx.reply('Koi active chat session nahi hai abhi.');
    return ctx.reply(rows.map(r => `${r.code} — ${new Date(r.created_at).toLocaleString()}`).join('\n'));
  }

  if (msg.reply_to_message && msg.text) {
    const map = db.prepare('SELECT code FROM tg_message_map WHERE tg_message_id = ?')
      .get(msg.reply_to_message.message_id);
    if (map) {
      db.prepare('INSERT INTO messages (code, sender, text, created_at) VALUES (?, ?, ?, ?)')
        .run(map.code, 'admin', msg.text, Date.now());
      return ctx.reply(`\u2705 ${map.code} ko bhej diya.`);
    }
    return ctx.reply('Ye message kisi active chat se match nahi hua.');
  }
});

bot.launch();
console.log('Telegram bot chalu ho gaya.');

app.listen(PORT, () => console.log(`Server chal raha hai: http://localhost:${PORT}`));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));