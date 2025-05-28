const express = require('express');
const router = express.Router();
const controller = require('../controllers/groups.controller');
//const requireAccountContext = require('../middlewares/requireAccountContext');

// Semua route di bawah ini harus dalam konteks account
//router.use(requireAccountContext);

// Lihat semua group dalam account
router.get('/', controller.getGroups);

// Buat group baru (name ≤ 10 char, no space, unique)
router.post('/create', controller.createGroup);

// Assign satu atau banyak user ke group
router.post('/assign', controller.assignGroup);

// Revoke user dari group (list atau "*")
router.post('/revoke', controller.revokeGroup);

// Tambahkan permission ke group
router.post('/permission/add', controller.addPermission);

// Hapus permission dari group
router.post('/permission/remove', controller.removePermissionFromGroup);
module.exports = router;