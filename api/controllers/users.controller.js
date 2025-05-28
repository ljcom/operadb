const { sendEvent } = require('../utils/eventSender');
const { generateScopedId, isValidNamespace } = require('../utils/idNaming');
const bcrypt = require('bcrypt');

async function createUserData(body, actor, accountId, req, res) {
  try{  
    const { username, email, password, group } = body;

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
          group
        },
        account: accountId,
        actor
      });
      return { message: 'User creation event submitted', event: result.data };
  } catch (err) {
    console.error('Create User Error:', err.message);
    return { status: 500, error: 'Failed to create user' };
  }
}
exports.createUser = async (req, res) => {
  try {
    const actor = req.user.id;
    const accountId = req.accountId;
    const r = createUserData(req.body, actor, accountId, req, res);
    res.status(r.status).json(message, error);
  } catch (err) {
    console.error('Create User Error:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
};
