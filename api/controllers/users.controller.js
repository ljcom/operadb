const { sendEvent } = require('../utils/eventSender');

exports.createUser = async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const accountId = req.accountId;
    const actor = req.user.id;

    if (!username) return res.status(400).json({ error: 'Missing username' });

    const result = await sendEvent({
      type: 'user.create',
      data: { username, email, role },
      account: accountId,
      actor
    });

    res.status(201).json({ message: 'User creation event submitted', event: result.data });
  } catch (err) {
    console.error('Create User Error:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
};