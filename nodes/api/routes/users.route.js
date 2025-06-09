const express = require('express');
const router = express.Router();
const controller = require('../controllers/users.controller');
const authMiddleware = require('../middlewares/auth');
const accountResolver = require('../middlewares/accountResolver');

// Create user (signature-based auth + accountResolver)
router.post(
    '/',
    [authMiddleware, accountResolver],
    controller.createUser
);

// Get all users
router.get(
    '/',
    [authMiddleware, accountResolver],
    controller.getUser
);

// Find by username
router.get(
    '/byname/:username',
    [authMiddleware, accountResolver],
    controller.findUser
);

module.exports = router;