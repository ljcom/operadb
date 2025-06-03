const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

dotenv.config({ path: path.join(__dirname, '.env') });

(async () => {
  try {
    const email = process.env.USER1_EMAIL;
    const accountId = process.env.ACCOUNT_ID;
    const privateKey = process.env.USER1_PRIVATE_KEY;

    if (!email || !accountId || !privateKey) {
      console.error('❌ Missing email, ACCOUNT_ID, or USER1_PRIVATE_KEY in .env');
      process.exit(1);
    }

    const wallet = new ethers.Wallet(privateKey);
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `login:${accountId}:${email}:${timestamp}`;
    const signature = await wallet.signMessage(message);

    const loginPayload = {
      accountId,
      email,
      timestamp,
      address: wallet.address,
      signature
    };

    console.log('🔑 Logging in with wallet...');
    const loginRes = await axios.post(`${process.env.API_URL}/login/wallet`, loginPayload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Login Success:');
    console.log(JSON.stringify(loginRes.data, null, 2));

    // Optional: Save token to .env
    const token = loginRes.data?.token;
    if (token) {
      const envPath = path.join(__dirname, '.env');
      const envContent = fs.readFileSync(envPath, 'utf-8').split('\n');
      const newEnv = envContent.filter(line => !line.startsWith('USER1_TOKEN='));
      newEnv.push(`USER1_TOKEN=${token}`);
      fs.writeFileSync(envPath, newEnv.join('\n'), 'utf-8');
      console.log('💾 USER1_TOKEN saved to .env');
    }

  } catch (err) {
    console.error('❌ Login Error:', err.response?.data || err.message);
    process.exit(1);
  }
})();