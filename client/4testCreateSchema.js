const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

(async () => {
  const API_URL = process.env.API_URL;
  const TOKEN = process.env.TOKEN;
  const ACCOUNT_ID = process.env.ACCOUNT_ID;

  try {
    const result = await axios.post(`${API_URL}/events`, {
      type: 'schema.create',
      data: {
        schemaId: 'product',
        description: 'Schema untuk produk',
        fields: ['product_id', 'name', 'unit'],
        version: '1.0',
        reducerCode: `
          function reducer(events) {
            const state = {};
            for (const e of events) {
              if (e.type === "product.create") {
                state[e.data.product_id] = {
                  name: e.data.name,
                  unit: e.data.unit
                };
              }
            }
            return { products: state };
          }
        `
      }
    }, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'x-account-id': ACCOUNT_ID
      }
    });

    console.log('✅ Schema event submitted:', result.data.event._id);
  } catch (err) {
    console.error('❌ Failed to submit schema:', err.response?.data || err.message);
  }
})();


