const express = require('express');
const router = express.Router();
const controller = require('../controllers/coins.controller');
const accountResolver = require('../middlewares/accountResolver');
const authMiddleware  = require('../middlewares/auth');
const auth = require('../middlewares/auth');

router.post('/', accountResolver, controller.createCoin);

router.post('/mint', [ authMiddleware, accountResolver ], controller.mintCoin);
router.post('/burn', [ authMiddleware, accountResolver ], controller.burnCoin);
router.post('/transfer', [ authMiddleware, accountResolver ], controller.transferCoin);
router.get('/balance/:address', controller.getBalance);
router.get('/supply', [ authMiddleware, accountResolver ], controller.getTotalSupply);
router.post('/approve', [ authMiddleware, accountResolver ], controller.approveSpender);
router.post('/transfer-from', [ authMiddleware, accountResolver ], controller.transferFromCoin);
router.get('/allowance/:owner/:spender', controller.getAllowance);
router.get('/:id', controller.getCoinMetadata);

module.exports = router;