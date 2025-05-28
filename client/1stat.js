const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const TOKEN = process.env.GATEWAY_SECRET || 'supersecuretoken';

async function checkMongoCollections() {
  const collections = ['events', 'states', 'snapshots'];
  for (const col of collections) {
    try {
      const res = await axios.post(`${GATEWAY_URL}/find`, {
        collection: col,
        query: {}
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });

      console.log(`📦 ${col}: ${res.data.length} documents`);
    } catch (err) {
      console.error(`❌ Failed to fetch ${col}:`, err.response?.data || err.message);
    }
  }
}

checkMongoCollections();