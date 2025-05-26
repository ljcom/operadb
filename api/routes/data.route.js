const express = require('express');
const router = express.Router();
const controller = require('../controllers/data.controller');
const accountResolver = require('../middlewares/accountResolver');
const auth = require('../middlewares/auth');

router.post('/', auth, accountResolver, controller.createDataSchema);

module.exports = router;