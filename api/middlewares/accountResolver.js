const { findFromGateway } = require('../utils/gatewayQuery');

module.exports = async function (req, res, next) {
  const account = req.query.account || req.headers['x-account-id'];
  if (!account) return res.status(400).json({ error: 'Missing account ID' });

  // ✅ Validasi ke database
  try {
    const found = await findFromGateway('states', {
      entityType: 'account',
      refId: account
    });    
    if (found.length === 0) {
      return res.status(400).json({ error: 'Invalid account ID' });
    }

    req.accountId = account;
    next();
  } catch (err) {
    console.error('AccountResolver Error:', err.message);
    return res.status(500).json({ error: 'Failed to resolve account' });
  }
};