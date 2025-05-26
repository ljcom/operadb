const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = process.env.API_URL;
const ACCOUNT_ID = process.env.ACCOUNT_ID || '';

const USERS = [
  { label: 'USER1', username: process.env.USER1_EMAIL || 'user1@example.com', password: process.env.USER1_PASSWORD || 'user1pass' },
  { label: 'USER2', username: process.env.USER2_EMAIL || 'user2@example.com', password: process.env.USER2_PASSWORD || 'user2pass' }
];

const envPath = path.join(__dirname, '.env');
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8').split('\n') : [];

function updateEnvToken(label, token) {
  const key = `TOKEN_${label}`;
  env = env.filter(line => !line.startsWith(`${key}=`));
  env.push(`${key}=${token}`);
}

(async () => {
  try {
    for (const user of USERS) {
      console.log(`🔐 Logging in ${user.label} (${user.username})...`);
      const response = await axios.post(`${API_URL}/login`, {
        username: user.username,
        password: user.password
      }, {
        headers: {
          'x-account-id': ACCOUNT_ID
        }
      });

      const token = response.data?.token;
      if (!token) throw new Error(`No token received for ${user.label}`);

      updateEnvToken(user.label, token);
      console.log(`✅ ${user.label} login success!`);
    }

    fs.writeFileSync(envPath, env.join('\n'), 'utf-8');
    console.log('💾 Tokens saved to .env');

  } catch (err) {
    console.error('❌ Login error:', err.response?.data || err.message);
  }
})();