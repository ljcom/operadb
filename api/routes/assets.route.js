const express = require('express');
const router = express.Router();
const controller = require('../controllers/assets.controller');
const accountResolver = require('../middlewares/accountResolver');
const auth = require('../middlewares/auth');

router.post('/mint', controller.mintAsset);
router.post('/burn', controller.burnAsset);
router.post('/transfer', controller.transferAsset);
router.get('/balance/:address', controller.getOwnedAssets);
router.get('/:id', controller.getAssetMetadata);

module.exports = router;