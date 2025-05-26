exports.replay = function (events) {
  const users = [];

  for (const e of events) {
    if (e.type === 'user.create') {
      users.push({
        username: e.data.username,
        email: e.data.email,
        role: e.data.role,
        createdAt: e.timestamp || e.createdAt || new Date()
      });
    }
  }

  return { users };
};