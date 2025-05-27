const { sendEvent } = require('../utils/eventSender');
const { generateScopedId, isValidNamespace } = require('../utils/idNaming');

exports.createUser = async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const actor = req.user.id;

    const accountId = req.accountId;

    if (!username) return res.status(400).json({ error: 'Missing username' });

    const userId = await generateScopedId('user', accountId, 'account', username);
    
    const result = await sendEvent({
      type: 'user.create',
      data: { userId, username, email, role },
      account: accountId,
      actor
    });

    res.status(201).json({ message: 'User creation event submitted', event: result.data });
  } catch (err) {
    console.error('Create User Error:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
};