require('dotenv').config();
const express = require('express');
const mongo = require('./mongo');

const app = express();
app.use(express.json());

const SECRET = process.env.GATEWAY_SECRET;

// 🔐 Middleware otorisasi
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token || token !== SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  next();
});

// 🔍 FIND
app.post('/find', async (req, res) => {
  const { collection, query, sort } = req.body;
  const result = await mongo.find(collection, query, sort);
  res.json(result);
});

// ➕ INSERT
app.post('/insert', async (req, res) => {
  const { collection, doc } = req.body;
  const result = await mongo.insert(collection, doc);
  res.json(result);
});

// 🛠️ UPDATE
app.post('/update', async (req, res) => {
  const { collection, filter, updateDoc, upsert } = req.body;

  if (!collection || typeof collection !== 'string') {
    console.error('❌ [UPDATE] Invalid or missing collection:', collection);
    return res.status(400).json({ error: 'Missing or invalid collection name' });
  }

  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    console.error('❌ [UPDATE] Missing or invalid filter:', filter);
    return res.status(400).json({ error: 'Missing or invalid filter object' });
  }

  if (!updateDoc || typeof updateDoc !== 'object') {
    console.error('❌ [UPDATE] Missing or invalid updateDoc:', updateDoc);
    return res.status(400).json({ error: 'Missing or invalid updateDoc' });
  }

  try {
    const result = await mongo.update(collection, filter, updateDoc, { upsert });
    console.log(`✅ [UPDATE] Collection '${collection}' updated`, result);
    res.json({ success: true, result });
  } catch (err) {
    console.error('❌ [UPDATE] Mongo update failed:', err.message);
    res.status(500).json({ error: 'Mongo update failed', detail: err.message });
  }
});

app.post('/cleanup', async (req, res) => {
  try {
    const collections = ['events', 'states', 'snapshots'];

    const result = {};
    for (const col of collections) {
      const del = await mongo.deleteMany(col, {});
      result[col] = del.deletedCount;
    }

    res.json({
      message: 'Full MongoDB cleanup completed',
      deleted: result
    });
  } catch (err) {
    console.error('Cleanup error:', err.message);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// ✅ Export app agar bisa dijalankan dari server.js
module.exports = app;