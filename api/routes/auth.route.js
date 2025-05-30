const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/', authController.login);
router.post('/wallet', authController.loginWithWallet);
module.exports = router;