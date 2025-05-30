require('dotenv').config();
const axios = require('axios');

const endpoint = process.env.API_URL;
const token = process.env.USER1_TOKEN;
const accountId = process.env.ACCOUNT_ID;

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};

// Contoh asset untuk masing-masing schema
const assets = [
  {
    schemaId: 'customer',
    entityType: 'asset',
    payload: {
      customer_id: 'CUST001',
      name: 'PT. Sukses Selalu',
      city: 'Jakarta',
      phone: '08123456789'
    }
  },
  {
    schemaId: 'certificate',
    entityType: 'asset',
    payload: {
      cert_id: 'CERT-A01',
      name: 'ISO 9001',
      issued_at: '2024-06-01'
    }
  },
  {
    schemaId: 'product',
    entityType: 'asset',
    payload: {
      product_id: 'PRD-01',
      name: 'Sabun Cair',
      unit: 'L'
    }
  }
];

(async () => {
  for (const asset of assets) {
    try {
      // Kirim sesuai backend kamu, biasanya /assets atau /records
      // Sesuaikan dengan field yang diminta backend saat mint asset
      const payload = {
        schemaId: asset.schemaId,
        entityType: asset.entityType,
        ...asset.payload,
        account: accountId // atau gunakan params jika backend perlu
      };
      const res = await axios.post(
        `${endpoint}/assets?account=${accountId}`,
        payload,
        { headers }
      );
      console.log(`✅ Created asset: ${asset.schemaId}`, res.data);
    } catch (err) {
      console.error(`❌ Failed to create asset: ${asset.schemaId}`, err.response?.data || err.message);
    }
  }
})();