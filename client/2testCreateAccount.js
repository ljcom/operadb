const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

dotenv.config({ path: path.join(__dirname, '.env') });

(async () => {
  try {
    const email=process.env.USER1_EMAIL;
    const password=process.env.USER1_PASSWORD;
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
    }
    setTimeout(async () => {
      const response = await axios.post(`${process.env.API_URL}/accounts`, 
        payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('✅ Response received:');
      console.log(JSON.stringify(response.data, null, 2));

      const accountId = response.data?.event?.data?.accountId;

    
      if (!accountId) {
        console.error('❌ Failed to extract Account ID');
        process.exit(1);
      }

      console.log(`✅ Account ID: ${accountId}`);

      // Simpan ke .env
      const envPath = path.join(__dirname, '.env');
      const envContent = fs.readFileSync(envPath, 'utf-8').split('\n');
      const newEnv = envContent.filter(line => !line.startsWith('ACCOUNT_ID='));
      newEnv.push(`ACCOUNT_ID=${accountId}`);
      fs.writeFileSync(envPath, newEnv.join('\n'), 'utf-8');

      console.log('💾 ACCOUNT_ID saved to .env');
    }, 2000);

  } catch (err) {
    console.error('❌ Request failed:', err.response?.data || err.message);
    process.exit(1);
  }
})();