const express = require('express');
const router = express.Router();
const controller = require('../controllers/data.controller');
const accountResolver = require('../middlewares/accountResolver');
const authMiddleware  = require('../middlewares/auth');

router.post('/issue', [ authMiddleware, accountResolver ], controller.issueData);
router.post('/revoke', [ authMiddleware, accountResolver ], controller.revokeData);
router.get('/:id', controller.getDataById);
router.get('/owner/:address', controller.getOwnedData);

module.exports = router;