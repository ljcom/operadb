const express = require('express');
const router = express.Router();
const controller = require('../controllers/groups.controller');
const accountResolver = require('../middlewares/accountResolver');
//const requireAccountContext = require('../middlewares/requireAccountContext');

// Semua route di bawah ini harus dalam konteks account
//router.use(requireAccountContext);

// Lihat semua group dalam account
router.get('/', accountResolver, controller.getGroups);

// Buat group baru (name ≤ 10 char, no space, unique)
router.post('/create', controller.createGroup);

// Assign satu atau banyak user ke group
router.post('/assign', controller.assignGroup);

// Revoke user dari group (list atau "*")
router.post('/revoke', controller.revokeGroup);

// Tambahkan role ke group
router.post('/role/add', controller.addRole);

// Hapus role dari group
router.post('/role/remove', controller.removeRoleFromGroup);
module.exports = router;