const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controller');
const accountResolver = require('../middlewares/accountResolver');
const { findFromGateway } = require('../utils/gatewayQuery');

// CREATE user via event
router.post('/', accountResolver, userController.createUser);

// GET all users (from state)
router.get('/', userController.getUser);
router.post('/invite', accountResolver, userController.inviteUser)
router.get('/byname/:username', userController.findUser);
module.exports = router;