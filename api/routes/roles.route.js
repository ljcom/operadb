const express = require('express');
const router = express.Router();
const controller = require('../controllers/roles.controller');
//const requireAccountContext = require('../middlewares/requireAccountContext');

// Semua route di bawah ini harus dalam konteks account
//router.use(requireAccountContext);

// Lihat semua role dalam account
router.get('/', controller.getRoles);

// Buat role baru (name ≤ 10 char, no space, unique)
router.post('/create', controller.createRole);

// Assign satu atau banyak user ke role
router.post('/assign', controller.assignRole);

// Revoke user dari role (list atau "*")
router.post('/revoke', controller.revokeRole);

// Tambahkan permission ke role
router.post('/permission/add', controller.addPermission);

// Hapus permission dari role
router.post('/permission/remove', controller.removePermissionFromRole);
module.exports = router;