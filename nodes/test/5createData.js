// testCreateData.js
require('dotenv').config();
const axios  = require('axios');
const { ethers } = require('ethers');

const API_URL     = process.env.API_URL;      // e.g. http://localhost:3000
const ACCOUNT_ID  = process.env.ACCOUNT_ID;   // accountId untuk accountResolver
const PRIVATE_KEY = process.env.USER1_PRIVATE_KEY;  // private key akun pemilik
const USER2_ADDRESS = process.env.USER2_ADDRESS;  // private key akun pemilik
const ASSET1 = process.env.ASSET1;  // unique
const ASSET2 = process.env.ASSET2;  // commodity 

// Inisialisasi wallet
const wallet = new ethers.Wallet(PRIVATE_KEY);

/**
 * Generate signature untuk autentikasi (“accounts.me:<timestamp>”)
 */
async function signMe() {
  const timestamp = Math.floor(Date.now() / 1000);
  const message   = `accounts.me:${timestamp}`;
  const signature = await wallet.signMessage(message);
  return { timestamp, signature };
}

/**
 * Issue satu data
 * @param {string} assetId – ID asset yang akan di-issue menjadi data, misal "obj:...:123"
 * @param {string} to      – address penerima data, misal "0xAbc123..."
 */
async function issueData(assetId, to) {
  const { timestamp, signature } = await signMe();

  const headers = {
    'Content-Type': 'application/json',
    'x-timestamp':   timestamp,
    'x-signature':   signature
  };

  const payload = {
    assetId,
    to
  };

  const url = `${API_URL}/data/issue?account=${ACCOUNT_ID}`;
  console.log(`⏳ Issuing data from asset="${assetId}" to="${to}"…`);

  const res = await axios.post(url, payload, { headers });
  console.log('✅ Data issued:', res.data);
}

(async () => {
  // Daftar data yang ingin di-issue
  const jobs = [
    { assetId: ASSET1, to: USER2_ADDRESS },
    { assetId: ASSET2, to: USER2_ADDRESS}
  ];

  for (const job of jobs) {
    try {
      await issueData(job.assetId, job.to);
    } catch (err) {
      console.error(
        `❌ Failed issuing data for asset="${job.assetId}":`,
        err.response?.data || err.message
      );
    }
  }
})();