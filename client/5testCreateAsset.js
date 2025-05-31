require('dotenv').config();
const axios = require('axios');

const endpoint = process.env.API_URL;
const token = process.env.USER1_TOKEN;
const accountId = process.env.ACCOUNT_ID;

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};

const assets = [
  {
    schemaId: 'customer',
    payload: {
      customer_id: 'CUST001',
      name: 'PT. Sukses Selalu',
      city: 'Jakarta',
      phone: '08123456789'
    }
  },
  {
    schemaId: 'certificate',
    payload: {
      cert_id: 'CERT-A01',
      name: 'ISO 9001',
      issued_at: '2024-06-01'
    }
  },
  {
    schemaId: 'product',
    payload: {
      product_id: 'PRD-01',
      name: 'Sabun Cair',
      unit: 'L',
      qty: 0
    }
  }
];

(async () => {
  for (const asset of assets) {
    try {
      const payload = {
        schemaId: asset.schemaId,
        ...asset.payload,
        account: accountId // atau pakai params jika backend perlu
      };
      const res = await axios.post(
        `${endpoint}/assets/mint?account=${accountId}`,
        payload,
        { headers }
      );
      console.log(`✅ Created asset: ${asset.schemaId}`, res.data);
    } catch (err) {
      console.error(`❌ Failed to create asset: ${asset.schemaId}`, err.response?.data || err.message);
    }
  }
})();