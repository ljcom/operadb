const axios = require('axios');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { ethers } = require('ethers');

const API_URL      = process.env.API_URL;       // e.g. http://localhost:3000
const ACCOUNT_ID   = process.env.ACCOUNT_ID;    // accountId Anda
const USER1_ADDR   = process.env.USER1_ADDRESS; // address User1
const USER2_ADDR   = process.env.USER2_ADDRESS; // address User2
const PRIVATE_KEY  = process.env.USER1_PRIVATE_KEY;   // private key pemilik account
const envPath = path.join(__dirname, '.env');
let coinId=process.env.COIN; // Ambil coinId dari .env

const wallet = new ethers.Wallet(PRIVATE_KEY);

async function signMe() {
  const timestamp = Math.floor(Date.now() / 1000);
  const message   = `accounts.me:${timestamp}`;
  const signature = await wallet.signMessage(message);
  return { timestamp, signature };
}

(async () => {
  try {
    // 1. USER1 create coin
    console.log('🪙 USER1 - Create Coin...');
    let { timestamp, signature } = await signMe();
    let headers = {
      'Content-Type': 'application/json',
      'x-timestamp':   timestamp,
      'x-signature':   signature
    };
    const createCoinRes = await axios.post(`${API_URL}/coins?account=${ACCOUNT_ID}`, {
      name: 'Test Coin',
      schemaId: 'coin',
      symbol: 'TCN',
      decimals: 2,
      totalSupply: 1000,
      to: USER1_ADDR,
      account: ACCOUNT_ID
    }, { headers });

    if (!coinId) {
      coinId = createCoinRes.data?.event?.data?.coinId;
      console.log('✅ Coin created:', createCoinRes.data);
      const envVars = fs.readFileSync(envPath, 'utf-8').split('\n');
      
      const newEnv = envVars.filter(line => !line.startsWith('COIN='));
      newEnv.push(`COIN=${coinId}`);
      fs.writeFileSync(envPath, newEnv.join('\n'), 'utf-8');
      console.log('💾 COIN saved to .env');
    }
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }

  try {
    // 2. USER1 transfer 300 ke USER2
    // TO DO ❌ Error: { error: 'Invalid recipient ID' }
    console.log('\n🔁 USER1 → USER2 Transfer 300...');
    ({ timestamp, signature } = await signMe());
    headers = { 'Content-Type': 'application/json', 
      'x-timestamp': timestamp, 
      'x-signature': signature };
    await axios.post(
      `${API_URL}/coins/transfer?account=${ACCOUNT_ID}`,
      { to: USER2_ADDR, amount: 300, coinId },
      { headers }
    );
    console.log('✅ Transfer success');
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }

  try {
    // 3. USER1 mint 200 lagi ke dirinya
    console.log('\n💰 USER1 mint 200...');
    ({ timestamp, signature } = await signMe());
    headers = { 'Content-Type': 'application/json', 'x-timestamp': timestamp, 'x-signature': signature };
    await axios.post(
      `${API_URL}/coins/mint?account=${ACCOUNT_ID}`,
      { to: USER1_ADDR, amount: 200, coinId },
      { headers }
    );
    console.log('✅ Mint success');
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }

  try {
    // 4. USER2 burn 100 dari miliknya
    console.log('\n🔥 USER2 burn 100...');
    ({ timestamp, signature } = await signMe());
    headers = { 'Content-Type': 'application/json', 'x-timestamp': timestamp, 'x-signature': signature };
    await axios.post(
      `${API_URL}/coins/burn?account=${ACCOUNT_ID}`,
      { amount: 100, coinId },
      { headers }
    );
    console.log('✅ Burn success');

    // 5. USER1 approve USER2 untuk belanja 150
    console.log('\n🔐 USER1 approve USER2 to spend 150...');
    ({ timestamp, signature } = await signMe());
    headers = { 'Content-Type': 'application/json', 'x-timestamp': timestamp, 'x-signature': signature };
    await axios.post(
      `${API_URL}/coins/approve?account=${ACCOUNT_ID}`,
      { spender: USER2_ADDR, amount: 150, coinId },
      { headers }
    );
    console.log('✅ Approved');

    // 6. USER2 ambil 100 dari USER1
    console.log('\n🛒 USER2 transferFrom USER1 (ambil 100)...');
    ({ timestamp, signature } = await signMe());
    headers = { 'Content-Type': 'application/json', 'x-timestamp': timestamp, 'x-signature': signature };
    await axios.post(
      `${API_URL}/coins/transfer-from?account=${ACCOUNT_ID}`,
      { from: USER1_ADDR, to: USER2_ADDR, amount: 100, coinId },
      { headers }
    );
    console.log('✅ TransferFrom success');

    // 7. Tampilkan saldo akhir
    console.log('\n📊 Checking final balances...');
    ({ timestamp, signature } = await signMe());
    headers = { 'x-timestamp': timestamp, 'x-signature': signature };
    const bal1 = await axios.get(
      `${API_URL}/coins/balance/${USER1_ADDR}?account=${ACCOUNT_ID}`,
      { headers }
    );
    ({ timestamp, signature } = await signMe());
    headers = { 'x-timestamp': timestamp, 'x-signature': signature };
    const bal2 = await axios.get(
      `${API_URL}/coins/balance/${USER2_ADDR}?account=${ACCOUNT_ID}`,
      { headers }
    );
    console.log(`👤 USER1 balance: ${bal1.data.balance}`);
    console.log(`👤 USER2 balance: ${bal2.data.balance}`);

    console.log('\n📄 Checking allowance...');
    ({ timestamp, signature } = await signMe());
    headers = { 'x-timestamp': timestamp, 'x-signature': signature };
    const allow = await axios.get(
      `${API_URL}/coins/allowance/${USER1_ADDR}/${USER2_ADDR}?account=${ACCOUNT_ID}&coinId=${coinId}`,
      { headers }
    );
    console.log(`🔎 Allowance USER2 → USER1: ${allow.data.allowance}`);
 

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
})();