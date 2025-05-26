const express = require('express');
const router = express.Router();
const eventController = require('../controllers/events.controller');
const auth = require('../middlewares/auth');
const account = require('../middlewares/accountResolver');

// Tambah event baru
router.post('/', auth, account, eventController.createEvent);

// Lihat semua event
router.get('/', eventController.getAllEvents);

// Lihat event berdasarkan ID
router.get('/:id', eventController.getEventById);

// Lihat event berdasarkan tipe (by type = byname)
router.get('/bytype/:type', eventController.getEventsByType);

module.exports = router;