const { sendEvent } = require('../utils/eventSender');
const { generateScopedId, isValidAddressFormat } = require('../utils/idNaming');
const { findFromGateway } = require('../utils/gatewayQuery');
const bcrypt = require('bcrypt');

async function createUserData(body, actor, accountId, req, res) {
  try{  
    const { username, email, password, group, address } = body;

      if (!username || !password || !address) return res.status(400).json({ error: 'Missing username, public address or password' });

      // CEK EXISTING USER DI STATE
      const state = await findFromGateway('states', {
        entityType: 'user',
        account: accountId
      });

      const users = state[0]?.state?.users || [];
      if (users.some(u => u.username === username)) {
        return { status: 409, error: 'User already exists' };
      }
      if (address && !isValidAddressFormat(address)) {
        return res.status(400).json({ error: 'Invalid Public address format' });
      }
      const userId = await generateScopedId('usr', accountId.split(':')[1], 'user', username);
      const passwordHash = await bcrypt.hash(password, 10);

      const result = await sendEvent({
        type: 'user.create',
        data: {
          userId,
          username,
          email,
          address,
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

exports.inviteUser = async (req, res) => {

}

exports.getUser = async (req, res) => {
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
}

exports.findUser = async (req, res) => {
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
}