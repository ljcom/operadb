const express = require('express');
const router = express.Router();
const controller = require('../controllers/coins.controller');
const accountResolver = require('../middlewares/accountResolver');
const auth = require('../middlewares/auth');

router.post('/', auth, accountResolver, controller.createCoin);

router.post('/mint', auth, accountResolver, controller.mintCoin);
router.post('/burn', auth, accountResolver, controller.burnCoin);
router.post('/transfer', auth, accountResolver, controller.transferCoin);
router.get('/balance/:address', auth, accountResolver, controller.getBalance);
router.get('/supply', auth, accountResolver, controller.getTotalSupply);
router.post('/approve', auth, accountResolver, controller.approveSpender);
router.post('/transfer-from', auth, accountResolver, controller.transferFromCoin);
router.get('/allowance/:owner/:spender', auth, accountResolver, controller.getAllowance);
router.get('/:id', controller.getCoinMetadata);

module.exports = router;