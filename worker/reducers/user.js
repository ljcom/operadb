exports.replay = function (events) {
  const users = {};

  for (const e of events) {
    if (e.type === 'user.create') {
      const userId = e.data.userId;
      users[userId] = {
        userId: e.data.userId,
        email: e.data.email,
        username: e.data.username,
        address: e.data.address,
        accountId: e.data.accountId,
        passwordHash: e.data.passwordHash,
        roles: Array.isArray(e.data.role) ? e.data.role : [e.data.role],
        createdAt: e.timestamp || e.createdAt || new Date()
      };
    }
  }

  //return { users };
  return users;
};