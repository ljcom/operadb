require('dotenv').config();
const axios = require('axios');

const endpoint = process.env.API_URL;
const token = process.env.USER1_TOKEN;
const accountId = process.env.ACCOUNT_ID;

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};

const schemas = [
  {
    schemaId: 'customer',
    entityType: 'asset',
    type: 'customer',
    fields: [
      { name: 'customer_id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'city', type: 'string', required: false },
      { name: 'phone', type: 'string', required: false }
    ]
  },
  {
    schemaId: 'certificate',
    entityType: 'asset',
    type: 'certificate',
    fields: [
      { name: 'cert_id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'issued_at', type: 'string', required: true }
    ]
  },
  {
    schemaId: 'product',
    entityType: 'asset',
    type: 'product',
    fields: [
      { name: 'product_id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'unit', type: 'string', required: true }
    ]
  }
];

(async () => {
  for (const schema of schemas) {
    try {
      const payload = { ...schema, accountId };
      const res = await axios.post(`${endpoint}/schemas`, schema, { headers });
      console.log(`✅ Created schema: ${schema.schemaId}`, res.data);
    } catch (err) {
      console.error(`❌ Failed to create schema: ${schema.schemaId}`, err.response?.data || err.message);
    }
  }
})();