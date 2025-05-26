const express = require('express');
const router = express.Router();
const controller = require('../controllers/assets.controller');
const accountResolver = require('../middlewares/accountResolver');
const auth = require('../middlewares/auth');

router.post('/mint', auth, accountResolver, controller.mintAsset);
router.post('/burn', auth, accountResolver, controller.burnAsset);
router.post('/transfer', auth, accountResolver, controller.transferAsset);
router.get('/balance/:address', auth, accountResolver, controller.getOwnedAssets);
router.get('/:id', auth, accountResolver, controller.getAssetMetadata);

module.exports = router;