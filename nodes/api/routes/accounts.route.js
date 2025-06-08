const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accounts.controller');
const authMiddleware = require('../middlewares/auth');

// Public route: Buat akun tanpa auth
router.post('/', accountController.createAccount);

// Private routes: Hanya bisa diakses jika sudah login
router.get('/', authMiddleware, accountController.listMyAccounts);
router.post('/me', accountController.getAccountMeBySignature);
router.get('/:id', authMiddleware, accountController.getAccountById);

module.exports = router;