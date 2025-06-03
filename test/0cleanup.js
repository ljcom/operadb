const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const TOKEN = process.env.GATEWAY_SECRET || 'supersecuretoken';

async function cleanup() {
  try {
    console.log(`🧹 Requesting full MongoDB cleanup from ${GATEWAY_URL}/cleanup...`);

    const response = await axios.post(`${GATEWAY_URL}/cleanup`, {}, {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      }
    });

    console.log('✅ Cleanup Result:');
    console.table(response.data.deleted);
  } catch (err) {
    console.error('❌ Cleanup failed:', err.response?.data || err.message);
  }
}

cleanup();