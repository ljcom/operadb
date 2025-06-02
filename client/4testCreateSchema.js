require('dotenv').config();
const axios = require('axios');

const endpoint = process.env.API_URL;
const token = process.env.USER1_TOKEN;
const accountId = process.env.ACCOUNT_ID;

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};

// Lengkapi formatType dan description di setiap schema!
const schemas = [
  {
    schemaId: 'employee',
    entityType: 'actor.people',
    version: 1,
    description: 'Schema untuk actor employee',
    reducerCode: '// reducer for employee',
    fields: [
      { name: 'actorId', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'address', type: 'address', required: false },
      { name: 'label', type: 'string', required: false },
      { name: 'note', type: 'string', required: false },
      { name: 'status', type: 'string', required: false }
    ]
  },
  {
    schemaId: 'certificate',
    entityType: 'asset.unique',
    type: 'certificate',
    version: 1,
    description: 'Schema untuk sertifikat',
    reducerCode: '// reducer for certificate',
    fields: [
      { name: 'assetId', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'qty', type: 'number', required: false },
      { name: 'unit', type: 'string', required: false },
      { name: 'issued_at', type: 'string', required: true },
      { name: 'owner', type: 'address', required: false },      
    ]
  },
  {
    schemaId: 'product',
    entityType: 'asset.commodity',
    type: 'product',
    version: 1,
    description: 'Schema untuk produk',
    reducerCode: '// reducer for product',
    fields: [
      { name: 'assetId', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'qty', type: 'number', required: true },
      { name: 'unit', type: 'string', required: true },
      { name: 'owner', type: 'address', required: false },
    ]
  },
  {
    schemaId: 'coin',
    entityType: 'coin',
    version: 1,
    description: 'Schema untuk koin digital',
    reducerCode: '// reducer for coin',
    fields: [
      { name: 'symbol', type: 'string', required: true },
      { name: 'decimals', type: 'number', required: true },
      { name: 'totalSupply', type: 'number', required: true },
      { name: 'to', type: 'string', required: false }
    ]
  },
  {
    schemaId: 'contract',
    entityType: 'contract',
    version: 1,
    description: 'Schema untuk kontrak kerja sama',
    reducerCode: '// reducer for contract',
    fields: [
      { name: 'contractId', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'partyA', type: 'string', required: true },
      { name: 'partyB', type: 'string', required: true },
      { name: 'effectiveDate', type: 'date', required: false },
      { name: 'expiryDate', type: 'date', required: false },
      { name: 'status', type: 'string', required: false },
    ]
  }
];

(async () => {
  for (const schema of schemas) {
    try {
      // Kirim sebagai body + query param account
      const payload = { ...schema };
      const res = await axios.post(`${endpoint}/schemas?account=${accountId}`, payload, { headers });
      console.log(`✅ Created schema: ${schema.schemaId}`, res.data);
    } catch (err) {
      console.error(`❌ Failed to create schema: ${schema.schemaId}`, err.response?.data || err.message);
    }
  }
})();