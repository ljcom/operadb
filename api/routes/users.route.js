const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controller');
const { findFromGateway } = require('../utils/gatewayQuery');

// CREATE user via event
router.post('/', userController.createUser);

// GET all users (from state)
router.get('/', async (req, res) => {
  try {
    const accountId = req.accountId || req.query.accountId || req.body.accountId;
    const state = await findFromGateway('states', {
      entityType: 'user',
      account: accountId
    });

    const users = state[0]?.state?.users || [];
    res.json(users);
  } catch (err) {
    console.error('Failed to fetch users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/byname/:username', async (req, res) => {
  try {
    const accountId = req.accountId || req.query.account || req.body.accountId;
    const state = await findFromGateway('states', {
      entityType: 'user',
      account: accountId
    });

    const usersObj = state[0]?.state || {};
    const users = Object.values(usersObj);
    const user = users.find(u => u.username === req.params.username);

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Failed to fetch user by username:', err.message);
    res.status(500).json({ error: 'Failed to fetch user by username' });
  }
});

module.exports = router;