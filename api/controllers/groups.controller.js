const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { generateScopedId, validateId } = require('../utils/idNaming');

// POST /groups/create
async function createGroupData(body, actor, accountId) {
try {
    const { name, description, roles } = body;  
    groupId = await generateScopedId('grp', accountId, 'usergroup', name);

    //check acccount State here


    // Validasi name
    if (!name || typeof name !== 'string' || name.length > 10 || /\s/.test(name) || !/^[a-zA-Z0-9_]+$/.test(name)) {
      return {status:400,
        error: 'Invalid group name. Max 10 chars, no spaces, only letters/numbers/underscore.'
      };
    }

    // Cek apakah group sudah ada
    const state = await findFromGateway('states', {
      entityType: 'account',
      entityId: accountId
    });

    if (state?.[0]?.groups?.[groupId]) {
      return { status:400, error: 'Group already exists' };
    }

    const event = await sendEvent({
      type: 'group.create',
      data: {
        groupId,
        groupName: name,
        description,
        roles
      },
      actor,
      account: accountId
    });

    return { status:201, message: 'Group created', event: event.data };
  } catch (err) {
    console.error('Create group failed:', err.message);
    return { status:500, error: 'Failed to create group' };
  }
}
exports.createGroup = async (req, res) => {
  try {
    const actor = req.user.id;
    const accountId = req.accountId;
    const r = createGroupData(req.body, actor, accountId, req, res);
    res.status(r.status).json(message, error);

  } catch (err) {
    console.error('Create Group Error:', err.message);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

// POST /groups/assign
exports.assignGroup = async (req, res) => {
  try {
    const { group, userIds = [], userId } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    const groupId = group.startsWith('group:') ? group : `group:${accountId}:usergroup:${group}`;

    const users = userIds.length ? userIds : (userId ? [userId] : []);

    if (!group || users.length === 0) {
      return res.status(400).json({ error: 'Missing group or user(s)' });
    }

    for (const uid of users) {
      if (!validateId(uid, ['usr'])) {
        return res.status(400).json({ error: `Invalid user ID: ${uid}` });
      }
    }

    const event = await sendEvent({
      type: 'group.assign',
      data: { groupid: groupId, userids: users },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Group(s) assigned', event: event.data });
  } catch (err) {
    console.error('Assign group failed:', err.message);
    res.status(500).json({ error: 'Failed to assign group' });
  }
};

// POST /groups/revoke
exports.revokeGroup = async (req, res) => {
  try {
    const { group, userIds = [], userId } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    const groupId = group.startsWith('group:') ? group : `group:${accountId}:usergroup:${group}`;
    const users = userIds.length ? userIds : (userId ? [userId] : []);

    if (!group || (!users.length && userIds !== '*')) {
      return res.status(400).json({ error: 'Missing group or user(s)' });
    }

    const eventType = userIds === '*' ? 'group.revokeAll' : 'group.revoke';
    const event = await sendEvent({
      type: eventType,
      data: {
        groupid: groupId,
        userids: userIds === '*' ? '*' : users
      },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Group(s) revoked', event: event.data });
  } catch (err) {
    console.error('Revoke group failed:', err.message);
    res.status(500).json({ error: 'Failed to revoke group' });
  }
};

exports.addRole = async (req, res) => {
  const { groupId, role } = req.body;
  if (!groupId || !role) {
    return res.status(400).json({ error: 'Missing groupId or role' });
  }

  await sendEvent({
    type: 'group.role.add',
    data: { groupId, role },
    actor: req.address,
    account: req.account
  });

  res.json({ success: true });
};

exports.removeRoleFromGroup = async function ({ groupid, role, actor, account }) {
  await sendEvent({
    type: 'group.role.remove',
    data: { groupid, role },
    actor,
    account
  });
}

// GET /groups
exports.getGroups = async (req, res) => {
  try {
    const accountId = req.accountId;
    const result = await findFromGateway('states', {
      entityType: 'account',
      entityId: accountId
    });

    const accountState = result?.[0];
    const groups = accountState?.groups || {};

    res.status(200).json({ accountId, groups });
  } catch (err) {
    console.error('Get groups failed:', err.message);
    res.status(500).json({ error: 'Failed to get groups' });
  }
};
