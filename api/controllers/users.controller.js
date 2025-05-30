const { sendEvent } = require('../utils/eventSender');
const { generateScopedId } = require('../utils/idNaming');
const { findFromGateway } = require('../utils/gatewayQuery');
const bcrypt = require('bcrypt');

async function createUserData(body, actor, accountId, req, res) {
  try{  
    const { username, email, password, group } = body;

      if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

      // CEK EXISTING USER DI STATE
      const state = await findFromGateway('states', {
        entityType: 'user',
        account: accountId
      });

      const users = state[0]?.state?.users || [];
      if (users.some(u => u.username === username)) {
        return { status: 409, error: 'User already exists' };
      }

      const userId = await generateScopedId('usr', accountId.split(':')[1], 'user', username);
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
      return { status:201, message: 'User creation event submitted', event: result.data };
  } catch (err) {
    console.error('Create User Error:', err.message);
    return { status: 500, error: 'Failed to create user' };
  }
}

exports.createUser = async (req, res) => {
  try {
    const actor = req.user.id;
    const accountId = req.accountId;
    const r = await createUserData(req.body, actor, accountId, req, res);

    if (r.error) return res.status(r.status).json({ error: r.error });
    res.status(r.status).json({ message: r.message, event: r.event });
  } catch (err) {
    console.error('Create User Error:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
};
