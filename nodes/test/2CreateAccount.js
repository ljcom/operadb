const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

dotenv.config({ path: path.join(__dirname, '.env') });

(async () => {
  const envPath = path.join(__dirname, '.env');
  const envVars = fs.readFileSync(envPath, 'utf-8').split('\n');
  const accountLine = envVars.find(line => line.startsWith('ACCOUNT_ID='));
  const existingAccountId = accountLine?.split('=')[1]?.trim();

  if (existingAccountId) {
    console.log(`ℹ️ ACCOUNT_ID already exists in .env: ${existingAccountId}`);
    console.log(`⏩ Skipping account creation...`);
    process.exit(0);
  }

  try {
    const email = process.env.USER1_EMAIL;
    const password = process.env.USER1_PASSWORD;
    const wallet = new ethers.Wallet(process.env.USER1_PRIVATE_KEY);
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `account.create:${email}:${timestamp}`;
    const signature = await wallet.signMessage(message);

    const payload = {
      namespace: `${Math.random().toString(36).substring(2, 10)}`,
      email,
      password,
      address: wallet.address,
      timestamp,
      signature
    };

    console.log('⏳ Creating account...');
    const response = await axios.post(`${process.env.API_URL}/accounts`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const accountId = response.data?.event?.data?.data?.accountId;

    if (!accountId) {
      console.error('❌ Failed to extract Account ID from response:');
      console.log(JSON.stringify(response.data, null, 2));
      process.exit(1);
    }

    console.log(`✅ Account created: ${accountId}`);

    const newEnv = envVars.filter(line => !line.startsWith('ACCOUNT_ID='));
    newEnv.push(`ACCOUNT_ID=${accountId}`);
    fs.writeFileSync(envPath, newEnv.join('\n'), 'utf-8');
    console.log('💾 ACCOUNT_ID saved to .env');

    //console.log('⏳ Waiting 1s for replay...');
    //await new Promise(resolve => setTimeout(resolve, 1000));

  const loginTimestamp = Math.floor(Date.now() / 1000); // lebih baik buat timestamp baru untuk login
  const loginMessage = `login:${accountId}:${email}:${loginTimestamp}`;
  const loginSignature = await wallet.signMessage(loginMessage);

    const loginPayload = {
      accountId,
      email,
      timestamp: loginTimestamp,
      address: wallet.address,
      signature: loginSignature
    };

    console.log('🔑 Logging in with wallet...');
    const loginRes = await axios.post(`${process.env.API_URL}/login/wallet`, loginPayload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Login Success:');
    console.log(JSON.stringify(loginRes.data, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
})();