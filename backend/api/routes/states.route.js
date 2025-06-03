const express = require('express');
const router = express.Router();
const stateController = require('../controllers/states.controller');

router.get('/:entity/:refId', stateController.getStateByRefId);

module.exports = router;