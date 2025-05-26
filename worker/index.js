const express = require('express');
const mongo = require('../mongo-gateway/mongo');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token || token !== process.env.GATEWAY_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  next();
});

app.post('/find', async (req, res) => {
  const { collection, query } = req.body;
  const data = await mongo.find(collection, query);
  res.json(data);
});

app.post('/insert', async (req, res) => {
  const { collection, doc } = req.body;
  const result = await mongo.insert(collection, doc);
  res.json(result);
});

app.post('/update', async (req, res) => {
  const { collection, filter, updateDoc } = req.body;
  const result = await mongo.update(collection, filter, updateDoc);
  res.json(result);
});

module.exports = app;