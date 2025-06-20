const { ethers } = require('ethers');
const bcrypt = require('bcrypt');
const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { isValidAddressFormat, isValidIdFormat } = require('../utils/idNaming');

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

    if (!isValidIdFormat(namespace)) {
      return res.status(400).json({ error: 'Invalid namespace format (3-16 lowercase chars)' });
    }

    // ✅ Validasi address langsung
    const isValid = isValidAddressFormat(address);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid address format or ID' });
    }
    const accountId = `org:${namespace}`;
    const adminUserId = `usr:${namespace}:admin`;
    const adminGroupId = `group:${namespace}:admins`;
    const passwordHash = await bcrypt.hash(password, 10);

    // 🔐 Verifikasi signature
    const message = `account.create:${email}:${timestamp}`;
    const recovered = ethers.verifyMessage(message, signature);

    if (!address.startsWith('0x') || recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'Signature verification failed' });
    }

    if (address && !isValidAddressFormat(address)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
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
            type: 'group.create',
            data: {
              groupId: adminGroupId,
              name: 'admin',
              description: 'First User',
              roles: ['*']
            }
          },
          {
            type: 'user.create',
            data: {
              userId: adminUserId,
              username: 'admin',
              email,
              passwordHash,
              group: [adminGroupId],
              address,       // ← add the PV-key address here
              accountId 
            }
          }
        ]        
      });

      res.status(201).json({
        message: 'Account + Group + User submitted in batch',
        event: data
      });
    } catch (err) {
      console.error('Create Account Error:', err.message);
      res.status(500).json({ error: 'Failed to create account' });
    }

};


exports.listMyAccounts = async (req, res) => {
  try {
    const userAddress = req.address;
    // ambil semua state akun
    const results = await findFromGateway('states', { entityType: 'account' });
    const accounts = results
      .map(r => {
        const state = r.state;
        const member = (state.users || []).find(u =>
          u.address.toLowerCase() === userAddress
        );
        if (!member) return null;
        return {
          accountId: r.refId,    // misal "org:acct1"
          role: member.group,    // misal "group:acct1:admins"
          refid: member.refid
        };
      })
      .filter(a => a);

    res.json(accounts);
  } catch (err) {
    console.error('Error listing accounts:', err);
    res.status(500).json({ error: 'Failed to list accounts' });
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

/**
 * POST /accounts/me
 * Body: { signature: string, timestamp: number }
 * Verifies signature of message `accounts.me:<timestamp>`,
 * recovers address, then finds all user.entries with that address
 * and returns their accountIds/refids/roles.
 */
exports.getAccountMeBySignature = async (req, res) => {
  const { signature, timestamp } = req.body;
  if (!signature || !timestamp) {
    return res.status(400).json({ error: 'Missing signature or timestamp' });
  }
  // 1) Validasi timestamp (5 menit)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return res.status(403).json({ error: 'Timestamp too old or too far ahead' });
  }

  // 2) Recover address
  const message = `accounts.me:${timestamp}`;
  let address;
  try {
    address = ethers.verifyMessage(message, signature).toLowerCase();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  if (!isValidAddressFormat(address)) {
    return res.status(401).json({ error: 'Recovered address invalid' });
  }

  try {
    // 3) Cari semua state user di setiap akun
    const states = await findFromGateway('states', { entityType: 'user' });
    const accounts = [];
    for (const s of states) {
      const u = s.state[s.refId] || {};
      //const u = users.find(u => u.address.toLowerCase() === address);
      if (u.address.toLowerCase()=== address) {
        // s.refId adalah accountRef, misal "org:acct1"
        accounts.push({
          accountId: u.accountId,
          refid: s.refid,
          groups: u.groups
        });
      }
    }
    return res.json(accounts);
  } catch (err) {
    console.error('Error in getAccountMeBySignature:', err);
    return res.status(500).json({ error: 'Failed to list accounts for this user' });
  }
};