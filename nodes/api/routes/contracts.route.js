const express = require('express');
const router = express.Router();
const controller = require('../controllers/contracts.controller');
const accountResolver = require('../middlewares/accountResolver');
const authMiddleware  = require('../middlewares/auth');

router.post('/create', [ authMiddleware, accountResolver ], controller.createContract);
router.get('/:id', controller.getContractById);
router.get('/subject/:address', controller.getContractsBySubject);

module.exports = router;