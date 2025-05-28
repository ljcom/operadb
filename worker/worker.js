const path = require('path'); // ⬅️ Tambahkan ini
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const axios = require('axios');
const { handleEventReplay } = require('./services/replay.service');

const GATEWAY = process.env.MONGO_GATEWAY_URL;
const SECRET = process.env.GATEWAY_SECRET;
const PORT = process.env.WORKER_PORT || 3003;

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('✅ Worker + Gateway Active'));

app.get('/replay', async (req, res) => {
  await runReplay();
  res.json({ status: 'replay triggered' });
});

app.listen(PORT, () => {
  console.log(`🛰️ Worker+Gateway listening on port ${PORT}`);
  runReplay();
});

// replay logic
async function runReplay() {
  try {
    console.log('🔁 Worker starting...');
    const res = await axios.post(`${GATEWAY}/find`, {
      collection: 'events',
      query: { type: { $regex: '.' } },
      sort: { timestamp: 1 }
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });

    const events = res.data;
    console.log(`📦 Found ${events.length} events`);

    for (const event of events) {
      await handleEventReplay(event);
    }

    console.log('✅ Replay complete');
  } catch (err) {
    console.error('❌ Worker replay error:', err.message);
  }
  
  //setInterval(runReplay, 5000); // cek event baru setiap 5 detik
}

module.exports = { runReplay };