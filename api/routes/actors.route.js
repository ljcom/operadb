const express = require('express');
const router = express.Router();
const controller = require('../controllers/actors.controller');
const accountResolver = require('../middlewares/accountResolver');
const auth = require('../middlewares/auth');

router.post('/register', accountResolver, controller.registerActor);
router.get('/list', controller.listActors);
router.get('/:id', controller.getActor);
router.post('/approve', controller.approveActor);
router.post('/update', controller.updateActor);

module.exports = router;