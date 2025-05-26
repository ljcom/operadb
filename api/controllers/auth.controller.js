const jwt = require('jsonwebtoken');
const { findFromGateway } = require('../utils/gatewayQuery');

exports.login = async (req, res) => {
  const { username } = req.body;

  if (!username) return res.status(400).json({ error: 'Missing username' });

  try {
    const users = await findFromGateway('users', { username });
    const user = users[0];

    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};