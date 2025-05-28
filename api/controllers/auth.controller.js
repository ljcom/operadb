
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // ⬅️ Tambahkan ini
const { findFromGateway } = require('../utils/gatewayQuery');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

  try {
    const users = await findFromGateway('states', { entityType: 'user' });

    const user = users.find(u => {
      const stateValues = Object.values(u.state || {})[0];
      return (
        stateValues?.username === username ||
        stateValues?.email === username
      );
    });

    if (!user || !user.state || !user.state[`${user.refId}`]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user.state[user.refId];
    const isValid = await bcrypt.compare(password, userData.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Unauthorized' });

    const token = jwt.sign(
      { id: user.refId, accountId: user.account },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: userData });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};