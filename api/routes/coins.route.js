const express = require('express');
const router = express.Router();
const controller = require('../controllers/coins.controller');
const accountResolver = require('../middlewares/accountResolver');
const auth = require('../middlewares/auth');

router.post('/', controller.createCoin);

router.post('/mint', controller.mintCoin);
router.post('/burn', controller.burnCoin);
router.post('/transfer', controller.transferCoin);
router.get('/balance/:address', controller.getBalance);
router.get('/supply', controller.getTotalSupply);
router.post('/approve', controller.approveSpender);
router.post('/transfer-from', controller.transferFromCoin);
router.get('/allowance/:owner/:spender', controller.getAllowance);
router.get('/:id', controller.getCoinMetadata);

module.exports = router;