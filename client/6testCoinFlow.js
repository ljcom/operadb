const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL;
const USER1_TOKEN = process.env.USER1_TOKEN;
const USER2_TOKEN = process.env.USER2_TOKEN;
const USER1_ADDRESS = process.env.USER1_ADDRESS;
const USER2_ADDRESS = process.env.USER2_ADDRESS;
const accountId = process.env.ACCOUNT_ID;

(async () => {
  try {
    // 1. USER1 create coin
    console.log('🪙 USER1 - Create Coin...');
    const createCoinRes = await axios.post(`${API_URL}/coins?account=${accountId}`, {
      name: 'Test Coin',
      schemaId: 'coin',
      symbol: 'TCN',
      decimals: 2,
      totalSupply: 1000,
      to: USER1_ADDRESS,
      account: accountId
    }, {
      headers: {
        Authorization: `Bearer ${USER1_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const coinId = createCoinRes.data?.event?.data?.coinId;
    console.log('✅ Coin created:', coinId);

    // 2. USER1 transfer 300 ke USER2
    console.log('\n🔁 USER1 → USER2 Transfer 300...');
    await axios.post(`${API_URL}/coins/transfer`, {
      to: USER2_ADDRESS,
      amount: 300,
      coinId
    }, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    console.log('✅ Transfer success');

    // 3. USER1 mint 200 lagi ke dirinya
    console.log('\n💰 USER1 mint 200...');
    await axios.post(`${API_URL}/coins/mint`, {
      to: USER1_ADDRESS,
      amount: 200,
      coinId
    }, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    console.log('✅ Mint success');

    // 4. USER2 burn 100 dari miliknya
    console.log('\n🔥 USER2 burn 100...');
    await axios.post(`${API_URL}/coins/burn`, {
      amount: 100,
      coinId
    }, {
      headers: { Authorization: `Bearer ${USER2_TOKEN}` }
    });
    console.log('✅ Burn success');

    // 5. USER1 approve USER2 untuk belanja 150
    console.log('\n🔐 USER1 approve USER2 to spend 150...');
    await axios.post(`${API_URL}/coins/approve`, {
      spender: USER2_ADDRESS,
      amount: 150,
      coinId
    }, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    console.log('✅ Approved');

    // 6. USER2 ambil 100 dari USER1
    console.log('\n🛒 USER2 transferFrom USER1 (ambil 100)...');
    await axios.post(`${API_URL}/coins/transfer-from`, {
      from: USER1_ADDRESS,
      to: USER2_ADDRESS,
      amount: 100,
      coinId
    }, {
      headers: { Authorization: `Bearer ${USER2_TOKEN}` }
    });
    console.log('✅ TransferFrom success');

    // 7. Tampilkan saldo akhir
    console.log('\n📊 Checking final balances...');
    const bal1 = await axios.get(`${API_URL}/coins/balance/${USER1_ADDRESS}`, {
      headers: { Authorization: `Bearer ${USER1_TOKEN}` }
    });
    const bal2 = await axios.get(`${API_URL}/coins/balance/${USER2_ADDRESS}`, {
      headers: { Authorization: `Bearer ${USER2_TOKEN}` }
    });

    console.log(`👤 USER1 balance: ${bal1.data.balance}`);
    console.log(`👤 USER2 balance: ${bal2.data.balance}`);

    // 8. Tampilkan allowance USER2 atas USER1
    console.log('\n📄 Checking allowance...');
    const allow = await axios.get(`${API_URL}/coins/allowance/${USER1_ADDRESS}/${USER2_ADDRESS}?coinId=${coinId}`, {
      headers: { Authorization: `Bearer ${USER2_TOKEN}` }
    });

    console.log(`🔎 Allowance USER2 → USER1: ${allow.data.allowance}`);

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
})();