// scripts/userSetup.js
require('dotenv').config();
const axios = require('axios');
const { ethers } = require('ethers');

const BASE_URL = process.env.API_URL;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const PRIVATE_KEY = process.env.USER1_PRIVATE_KEY;    // private key pemilik account
const ADDRESS = new ethers.Wallet(PRIVATE_KEY).address.toLowerCase();

/**
 * Buat signature untuk pesan “accounts.me:<timestamp>”
 */
async function signTimestamp() {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `accounts.me:${timestamp}`;
  const signature = await new ethers.Wallet(PRIVATE_KEY).signMessage(message);
  return { timestamp, signature };
}

/**
 * Cek apakah user dengan username ada
 */
async function userExists(username) {
  const { timestamp, signature } = await signTimestamp();
  try {
    await axios.get(
      `${BASE_URL}/users/byname/${encodeURIComponent(username)}`,
      {
        headers: {
          'x-timestamp': timestamp,
          'x-signature': signature,
          'x-address': ADDRESS,
        },
        params: { account: ACCOUNT_ID }
      }
    );
    console.log(`✅ User "${username}" exists.`);
    return true;
  } catch (err) {
    if (err.response?.status === 404) {
      console.log(`❌ User "${username}" not found.`);
      return false;
    }
    console.error('Error checking user existence:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Buat user baru
 */
async function createUser({ username, email, password, group, address }) {
  const { timestamp, signature } = await signTimestamp();
  const payload = {
    username,
    email,
    password,
    group,
    address,
    accountId: ACCOUNT_ID,
    timestamp,
    signature
  };

  try {
    const res = await axios.post(
      `${BASE_URL}/users?account=${ACCOUNT_ID}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-timestamp': timestamp,
          'x-signature': signature
        }
      }
    );
    console.log('✅ User creation submitted:', res.data);
  } catch (err) {
    console.error('❌ Create user failed:', err.response?.data || err.message);
    throw err;
  }
}


(async () => {
  const USER2_ID = process.env.USER2_ID;
  const USER2_EMAIL = process.env.USER2_EMAIL;
  const USER2_PASSWORD = process.env.USER2_PASSWORD;
  const USER2_ADDRESS = process.env.USER2_ADDRESS;
  const GROUP_ADMIN = `group:${ACCOUNT_ID}:admins`;

  // Tanpa login—langsung sign & request
  const exists = await userExists(USER2_ID);
  if (!exists) {
    console.log(`🆕 Creating "${USER2_ID}"...`);
    await createUser({
      username: USER2_ID,
      email: USER2_EMAIL,
      password: USER2_PASSWORD,
      group: GROUP_ADMIN,
      address: USER2_ADDRESS
    });
  }
})();