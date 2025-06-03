const express = require('express');
const router = express.Router();
const controller = require('../controllers/data.controller');
const accountResolver = require('../middlewares/accountResolver');

router.post('/issue', accountResolver, controller.issueData);
router.post('/revoke', controller.revokeData);
router.get('/:id', controller.getDataById);
router.get('/owner/:address', controller.getOwnedData);

module.exports = router;