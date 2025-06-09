const express = require('express');
const router = express.Router();
const controller = require('../controllers/assets.controller');
const accountResolver = require('../middlewares/accountResolver');
const authMiddleware  = require('../middlewares/auth');
router.post('/mint', [ authMiddleware, accountResolver ], controller.mintAsset);
router.post('/burn', [ authMiddleware, accountResolver ], controller.burnAsset);
router.post('/transfer', [ authMiddleware, accountResolver ], controller.transferAsset);
router.get('/balance/:address', controller.getOwnedAssets);
router.get('/:id', controller.getAssetMetadata);

module.exports = router;