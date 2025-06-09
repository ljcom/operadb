const express = require('express');
const router = express.Router();
const controller = require('../controllers/actors.controller');
const accountResolver = require('../middlewares/accountResolver');
const authMiddleware  = require('../middlewares/auth');

router.post('/register', [ authMiddleware, accountResolver ], controller.registerActor);
router.get('/list', controller.listActors);
router.get('/:id', controller.getActor);
router.post('/approve', [ authMiddleware, accountResolver ], controller.approveActor);
router.post('/update', [ authMiddleware, accountResolver ], controller.updateActor);

module.exports = router;