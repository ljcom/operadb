// testCreateContract.js
require('dotenv').config();
const axios  = require('axios');
const { ethers } = require('ethers');

const API_URL     = process.env.API_URL;      // e.g. http://localhost:3000
const ACCOUNT_ID  = process.env.ACCOUNT_ID;   // accountId untuk accountResolver
const PRIVATE_KEY = process.env.USER1_PRIVATE_KEY;  // private key akun pemilik

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

async function createContract() {
  // 1) Generate signature headers
  const { timestamp, signature } = await signMe();
  const headers = {
    'Content-Type': 'application/json',
    'x-timestamp':   timestamp,
    'x-signature':   signature
  };

  // 2) Bentuk payload sesuai contracts.controller.js
  const payload = {
    schema_id:  '<YOUR_CONTRACT_SCHEMA_ID>',   // ganti dengan schemaId yang formatType = 'contract'
    type:       'agreement',                   // contoh nilai contract_type
    subject:    `account:${ACCOUNT_ID}`,       // bisa juga 'user:<address>'
    data:       {                              // isi data sesuai field schema
      startDate: '2025-06-01',
      endDate:   '2025-12-31',
      amount:    1000
    },
    from:       `account:${ACCOUNT_ID}`,       // hanya boleh dari akun sendiri
    to:         'account:targetAccount123',    // ganti dengan account atau user tujuan
    status:     'draft',                       // optional, default 'draft'
    visibility: 'private',                     // optional, default 'private'
    metadata:   {                              // optional
      note: 'Test contract creation'
    }
  };

  // 3) Kirim request
  try {
    const res = await axios.post(
      `${API_URL}/contracts/create?account=${ACCOUNT_ID}`,
      payload,
      { headers }
    );
    console.log('✅ Contract created:', res.data);
  } catch (err) {
    console.error(
      '❌ Error creating contract:',
      err.response?.data || err.message
    );
  }
}

createContract();