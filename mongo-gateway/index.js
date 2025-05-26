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
  const { collection, filter, updateDoc, options } = req.body;
  const result = await mongo.update(collection, filter, updateDoc, options);
  res.json(result);
});

// ✅ Export app agar bisa dijalankan dari server.js
module.exports = app;