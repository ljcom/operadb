const express = require('express');
const router = express.Router();
const controller = require('../controllers/contracts.controller');
const accountResolver = require('../middlewares/accountResolver');

router.post('/create', accountResolver, controller.createContract);
router.get('/:id', controller.getContractById);
router.get('/subject/:address', controller.getContractsBySubject);

module.exports = router;