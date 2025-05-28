const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { generateScopedId, validateId } = require('../utils/idNaming');

// POST /roles/create
async function createRoleData(body, actor, accountId) {
try {
    const { name, description, permissions } = body;  
    roleId = await generateScopedId('role', accountId, 'userrole', name);

    //check acccount State here


    // Validasi name
    if (!name || typeof name !== 'string' || name.length > 10 || /\s/.test(name) || !/^[a-zA-Z0-9_]+$/.test(name)) {
      return {status:400,
        error: 'Invalid role name. Max 10 chars, no spaces, only letters/numbers/underscore.'
      };
    }

    // Cek apakah role sudah ada
    const state = await findFromGateway('states', {
      entityType: 'account',
      entityId: accountId
    });

    if (state?.[0]?.roles?.[roleId]) {
      return { status:400, error: 'Role already exists' };
    }

    const event = await sendEvent({
      type: 'role.create',
      data: {
        roleId,
        roleName,
        description,
        permissions
      },
      actor,
      account: accountId
    });

    return { status:201, message: 'Role created', event: event.data };
  } catch (err) {
    console.error('Create role failed:', err.message);
    return { status:500, error: 'Failed to create role' };
  }
}
exports.createRole = async (req, res) => {
  try {
    const actor = req.user.id;
    const accountId = req.accountId;
    createRoleData(req.body, actor, accountId, req, res);
  } catch (err) {
    console.error('Create Role Error:', err.message);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

// POST /roles/assign
exports.assignRole = async (req, res) => {
  try {
    const { role, userIds = [], userId } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    const roleId = role.startsWith('role:') ? role : `role:${accountId}:userrole:${role}`;

    const users = userIds.length ? userIds : (userId ? [userId] : []);

    if (!role || users.length === 0) {
      return res.status(400).json({ error: 'Missing role or user(s)' });
    }

    for (const uid of users) {
      if (!validateId(uid, ['usr'])) {
        return res.status(400).json({ error: `Invalid user ID: ${uid}` });
      }
    }

    const event = await sendEvent({
      type: 'role.assign',
      data: { role_id: roleId, user_ids: users },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Role(s) assigned', event: event.data });
  } catch (err) {
    console.error('Assign role failed:', err.message);
    res.status(500).json({ error: 'Failed to assign role' });
  }
};

// POST /roles/revoke
exports.revokeRole = async (req, res) => {
  try {
    const { role, userIds = [], userId } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    const roleId = role.startsWith('role:') ? role : `role:${accountId}:userrole:${role}`;
    const users = userIds.length ? userIds : (userId ? [userId] : []);

    if (!role || (!users.length && userIds !== '*')) {
      return res.status(400).json({ error: 'Missing role or user(s)' });
    }

    const eventType = userIds === '*' ? 'role.revokeAll' : 'role.revoke';
    const event = await sendEvent({
      type: eventType,
      data: {
        role_id: roleId,
        user_ids: userIds === '*' ? '*' : users
      },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Role(s) revoked', event: event.data });
  } catch (err) {
    console.error('Revoke role failed:', err.message);
    res.status(500).json({ error: 'Failed to revoke role' });
  }
};

exports.addPermission = async (req, res) => {
  const { roleId, permission } = req.body;
  if (!roleId || !permission) {
    return res.status(400).json({ error: 'Missing roleId or permission' });
  }

  await sendEvent({
    type: 'role.permission.add',
    data: { roleId, permission },
    actor: req.address,
    account: req.account
  });

  res.json({ success: true });
};

exports.removePermissionFromRole = async function ({ role_id, permission, actor, account }) {
  await sendEvent({
    type: 'role.permission.remove',
    data: { role_id, permission },
    actor,
    account
  });
}

// GET /roles
exports.getRoles = async (req, res) => {
  try {
    const accountId = req.accountId;
    const result = await findFromGateway('states', {
      entityType: 'account',
      entityId: accountId
    });

    const accountState = result?.[0];
    const roles = accountState?.roles || {};

    res.status(200).json({ accountId, roles });
  } catch (err) {
    console.error('Get roles failed:', err.message);
    res.status(500).json({ error: 'Failed to get roles' });
  }
};
