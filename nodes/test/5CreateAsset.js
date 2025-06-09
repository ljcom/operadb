require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const API_URL     = process.env.API_URL;      // e.g. http://localhost:3000
const ACCOUNT_ID  = process.env.ACCOUNT_ID;   // your accountId
const PRIVATE_KEY = process.env.USER1_PRIVATE_KEY;  // your account’s private key
const envPath = path.join(__dirname, '.env');

// init wallet
const wallet = new ethers.Wallet(PRIVATE_KEY);

/**
 * Generate signature for “accounts.me:<timestamp>”
 */
async function signMe() {
  const timestamp = Math.floor(Date.now() / 1000);
  const message   = `accounts.me:${timestamp}`;
  const signature = await wallet.signMessage(message);
  return { timestamp, signature };
}

const assets = [
  {
    schemaId: 'certificate',
    payload: {
      assetId: 'CERA01',
      name: 'ISO 9001',
      issued_at: '2024-06-01'
    }
  },
  {
    schemaId: 'product',
    payload: {
      assetId: 'PRDX01',
      name: 'Sabun Cair',
      unit: 'L',
      qty: 0
    }
  }
];

(async () => {
  // 1) buat signature header
  const { timestamp, signature } = await signMe();
  const headers = {
    'Content-Type': 'application/json',
    'x-timestamp':   timestamp,
    'x-signature':   signature
  };

  // 2) kirim setiap asset
  let n=0;
  for (const asset of assets) {
    n++;
    const body = {
      schemaId: asset.schemaId,
      ...asset.payload
    };

    try {
      const res = await axios.post(
        `${API_URL}/assets/mint?account=${ACCOUNT_ID}`,
        body,
        { headers }
      );
      console.log(`✅ Created asset [${asset.schemaId}]:`, res.data);
      const envVars = fs.readFileSync(envPath, 'utf-8').split('\n');
      const assetId= res.data?.event?.data?.assetId;
      const newEnv = envVars.filter(line => !line.startsWith('ASSET${n}='));
      newEnv.push(`ASSET${n}=${assetId}`);
      fs.writeFileSync(envPath, newEnv.join('\n'), 'utf-8');
      console.log('💾 ASSET${n} saved to .env');
  
    } catch (err) {
      console.error(
        `❌ Failed to create [${asset.schemaId}]:`,
        err.response?.data || err.message
      );
    }
  }

})();