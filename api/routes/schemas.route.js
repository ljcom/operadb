const express = require('express');
const router = express.Router();
const schemaController = require('../controllers/schemas.controller');
const accountResolver = require('../middlewares/accountResolver');

const GATEWAY = process.env.MONGO_GATEWAY_URL;
const SECRET = process.env.GATEWAY_SECRET;

router.post('/', accountResolver, schemaController.createSchema);

// GET /schemas → semua schema
router.get('/', async (req, res) => {
  try {
    const result = await axios.post(`${GATEWAY}/find`, {
      collection: 'states',
      query: {
        entityType: 'schema',
        account: req.accountId
      }
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });

    const schemas = result.data[0]?.state?.schemas || [];
    res.json(schemas);
  } catch (err) {
    console.error('Failed to fetch schemas from state:', err.message);
    res.status(500).json({ error: 'Failed to fetch schemas' });
  }
});


// GET /schemas/byname/:schemaId
router.get('/byname/:schemaId', async (req, res) => {
  try {
    const result = await axios.post(`${GATEWAY}/find`, {
      collection: 'states',
      query: {
        entityType: 'schema',
        account: req.accountId
      }
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });

    const schemas = result.data[0]?.state?.schemas || [];
    const found = schemas.find(s => s.schemaId === req.params.schemaId);

    if (!found) return res.status(404).json({ error: 'Schema not found' });
    res.json(found);
  } catch (err) {
    console.error('Failed to fetch schema by name:', err.message);
    res.status(500).json({ error: 'Failed to fetch schema' });
  }
});

module.exports = router;