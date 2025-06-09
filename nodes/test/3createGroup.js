// testCreateGroup.js
require('dotenv').config();
const axios  = require('axios');
const { ethers } = require('ethers');

const BASE_URL    = process.env.API_URL;      // e.g. http://localhost:3000
const PRIVATE_KEY = process.env.USER1_PRIVATE_KEY;  // private key akun
const wallet      = new ethers.Wallet(PRIVATE_KEY);
const ACCOUNT_ID = process.env.ACCOUNT_ID;

/**
 * Buat signature untuk autentikasi (generic)
 */
async function signMe() {
  const timestamp = Math.floor(Date.now() / 1000);
  const message   = `accounts.me:${timestamp}`;
  const signature = await wallet.signMessage(message);
  return { timestamp, signature };
}

async function testCreateGroup() {
  // 1) Generate signature header
  const { timestamp, signature } = await signMe();

  // 2) Payload untuk create group
  const payload = {
    name:        'testgroup',              // <10 chars, no spaces
    description: 'Group untuk testing',
    roles:       ['admin', 'member']       // array of role strings
  };

  console.log('⏳ Creating group...');
  const res = await axios.post(
    `${BASE_URL}/groups/create?account=${ACCOUNT_ID}`,
    payload,
    {
      headers: {
        'Content-Type':  'application/json',
        'x-timestamp':    timestamp,
        'x-signature':    signature
      }
    }
  );
  console.log('✅ Group created:', res.data);
}

testCreateGroup().catch(err => {
  console.error('❌ Error creating group:', err.response?.data || err.message);
});