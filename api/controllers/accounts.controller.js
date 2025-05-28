const { ethers } = require('ethers');
const bcrypt = require('bcrypt');
const { sendEvent } = require('../utils/eventSender');
const { isValidAddressFormat, isValidNamespace } = require('../utils/idNaming');

exports.createAccount = async (req, res) => {
  console.log('🟡 Entered createAccount controller');
  
    const { namespace, email, password, address, signature, timestamp } = req.body;

    if (!namespace || !email || !password || !address || !signature || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 🕒 Validasi timestamp tidak terlalu jauh (5 menit window)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return res.status(403).json({ error: 'Timestamp too old or too far ahead' });
    }

    if (!isValidNamespace(namespace)) {
      return res.status(400).json({ error: 'Invalid namespace format (3-16 lowercase chars)' });
    }

    // ✅ Validasi address langsung
    const isValid = isValidAddressFormat(address);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid address format or ID' });
    }
    const accountId = `org:${namespace}`;
    const adminUserId = `usr:${namespace}:admin`;
    const adminRoleId = `role:${namespace}:admins`;
    const passwordHash = await bcrypt.hash(password, 10);

    // 🔐 Verifikasi signature
    const message = `account.create:${email}:${timestamp}`;
    const recovered = ethers.verifyMessage(message, signature);

    if (!address.startsWith('0x') || recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'Signature verification failed' });
    }

    //bukan generateScopedId
    //const accountId = generateId('org', { email, address }); // one-time hashed

    try {
      const data=await sendEvent({
        type: 'account.create',
        data: {
          accountId,
          address,
          admin_user: adminUserId
        },
        actor: address,
        account: 'system',
        //batchId: `batch:${Date.now()}`,
        prior: [
          {
            type: 'role.create',
            data: {
              roleId: adminRoleId,
              name: 'admin',
              description: 'First User',
              permissions: ['*']
            }
          },
          {
            type: 'user.create',
            data: {
              userId: adminUserId,
              username: 'admin',
              email,
              passwordHash,
              role: [adminRoleId]
            }
          }
        ]        
      });

      res.status(201).json({
        message: 'Account + Role + User submitted in batch',
        event: result
      });
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