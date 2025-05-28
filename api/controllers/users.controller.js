const { sendEvent } = require('../utils/eventSender');
const { generateScopedId, isValidNamespace } = require('../utils/idNaming');
const bcrypt = require('bcrypt');

exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

    const userId = await generateScopedId('user', accountId, 'account', username);
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sendEvent({
      type: 'user.create',
      data: {
        userId,
        username,
        email,
        passwordHash,
        role
      },
      account: accountId,
      actor
    });

    res.status(201).json({ message: 'User creation event submitted', event: result.data });
  } catch (err) {
    console.error('Create User Error:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
};
