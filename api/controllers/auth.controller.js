const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { findFromGateway } = require('../utils/gatewayQuery');
const { ethers } = require('ethers');

exports.login = async (req, res) => {
  const { accountId, username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Missing username or password' });

  try {
    const users = await findFromGateway('states', { entityType: 'user' });

    let userEntry, userData;
    for (const u of users) {
      const stateObj = Object.values(u.state || {})[0];
      if (stateObj?.username === username || stateObj?.email === username) {
        userEntry = u;
        userData = stateObj;
        break;
      }
    }

    if (!userEntry || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(password, userData.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Unauthorized' });

    // ⬇️ Cek apakah account-nya benar-benar ada di state
    let accountResult = await findFromGateway('states', {
      entityType: 'account',
      refId: accountId
    });

    if (!accountResult.length) {
      // fallback: cek via address (jika user punya)
      if (userData.address) {
        const byAddress = await findFromGateway('states', {
          entityType: 'account',
          'state.address': userData.address.toLowerCase()
        });
        if (byAddress.length) {
          userEntry.account = byAddress[0].refId; // update accountId dari sini
          accountResult = byAddress;
        }
      }
    }

    if (!accountResult.length) {
      return res.status(403).json({ error: 'Account state not found. Please wait or contact admin.' });
    }

    const token = jwt.sign(
      { id: userEntry.refId, accountId: userEntry.account },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: userData });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.loginWithWallet = async (req, res) => {
  const { accountId, email, timestamp, signature, address } = req.body;

  // 1. Cek field wajib
  if (!accountId || !email || !timestamp || !signature || !address)
    return res.status(400).json({ error: 'Missing required fields' });

  // 2. Cek timestamp valid (±5 menit)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300)
    return res.status(403).json({ error: 'Timestamp too old or too far ahead' });

  // 3. Challenge message lebih ketat, include accountId
  const message = `login:${accountId}:${email}:${timestamp}`;
  let recovered;
  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  if (recovered.toLowerCase() !== address.toLowerCase())
    return res.status(403).json({ error: 'Signature verification failed' });

  // 4. Cari account by accountId, dan address harus cocok
  const accounts = await findFromGateway('states', {
    entityType: 'account',
    refId: accountId
  });
  if (!accounts.length)
    return res.status(404).json({ error: 'Account not found' });
  const account = accounts[0];

  // 5. Pastikan address cocok di state account
  if (!account.state || !account.state.address || account.state.address.toLowerCase() !== address.toLowerCase())
    return res.status(403).json({ error: 'Address does not match account' });

  // 6. (Opsional) Email juga bisa dicek (kalau disimpan di account)
  // if (account.state.email && account.state.email !== email) {
  //   return res.status(403).json({ error: 'Email does not match account' });
  // }

  // 7. JWT & response
  const token = jwt.sign(
    { address, accountId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token, accountId, address });
};