const express = require('express');
const router = express.Router();
const schemaController = require('../controllers/schemas.controller');
const accountResolver = require('../middlewares/accountResolver');
const authMiddleware = require('../middlewares/auth');

const GATEWAY = process.env.MONGO_GATEWAY_URL;
const SECRET = process.env.GATEWAY_SECRET;

router.post('/', [authMiddleware, accountResolver], schemaController.createSchema);

// GET /schemas → semua schema
router.get('/', schemaController.getSchema);

// GET /schemas/byname/:schemaId
router.get('/byname/:schemaId', schemaController.findSchema);

module.exports = router;