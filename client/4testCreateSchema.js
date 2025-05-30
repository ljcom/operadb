require('dotenv').config();
const axios = require('axios');

const endpoint = process.env.API_URL;
const token = process.env.USER1_TOKEN;
const accountId = process.env.ACCOUNT_ID;

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};

// Lengkapi format_type dan description di setiap schema!
const schemas = [
  {
    schemaId: 'customer',
    entityType: 'asset',
    type: 'customer',
    version: 1,
    format_type: 'actor',
    description: 'Schema untuk data customer',
    reducerCode: '// reducer for customer',
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
    version: 1,
    format_type: 'unique',
    description: 'Schema untuk sertifikat',
    reducerCode: '// reducer for certificate',
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
    version: 1,
    format_type: 'commodity',
    description: 'Schema untuk produk',
    reducerCode: '// reducer for product',
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
      // Kirim sebagai body + query param account
      const payload = { ...schema, account: accountId };
      const res = await axios.post(`${endpoint}/schemas?account=${accountId}`, payload, { headers });
      console.log(`✅ Created schema: ${schema.schemaId}`, res.data);
    } catch (err) {
      console.error(`❌ Failed to create schema: ${schema.schemaId}`, err.response?.data || err.message);
    }
  }
})();