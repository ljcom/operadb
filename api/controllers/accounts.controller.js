const { ethers } = require('ethers');
const bcrypt = require('bcrypt');
const { sendEvent } = require('../utils/eventSender');
const { generateId } = require('../utils/idNaming');


console.log('✅ accounts.controller.js loaded');

exports.createAccount = async (req, res) => {
  console.log('🟡 Entered createAccount controller');
  console.log('📦 req.body:', req.body);
  try {
    const { email, password, address, signature, timestamp } = req.body;

    if (!email || !password || !address || !signature || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 🕒 Validasi timestamp tidak terlalu jauh (5 menit window)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return res.status(403).json({ error: 'Timestamp too old or too far ahead' });
    }

    // 🔐 Verifikasi signature
    const message = `account.create:${email}:${timestamp}`;
    const recovered = ethers.verifyMessage(message, signature);

    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'Signature verification failed' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const accountId = generateId('contract', { description, fields, reducerCode, version });

    const result = await sendEvent({
      type: 'account.create',
      data: {
        accountId,
        email,
        address,
        passwordHash
      },
      account: 'system',
      actor: address
    });
    res.status(201).json({ message: 'Account creation submitted', 
        event: result.data });

  } catch (err) {
    console.error('Create Account Error:', err.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

exports.getAccountMe = async (req, res) => {
  const accountId = req.accountId;
  try {
    const result = await findFromGateway('states', {
      entityType: 'account',
      refId: accountId
    });
    const account = result[0]?.state;
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};

exports.getAccountById = async (req, res) => {
  try {
    const result = await findFromGateway('states', {
      entityType: 'account',
      refId: req.params.id
    });
    const account = result[0]?.state;
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account by id' });
  }
};