exports.replay = function (events) {
  const groupMap = {};

  for (const event of events) {
    const { type, data, timestamp, createdAt } = event;

    if (type === 'group.create') {
      groupMap[data.groupId] = {
        groupId: data.groupId,
        groupName: data.name,
        description: data.description || '',
        roles: data.roles || [],
        createdAt: timestamp || createdAt || new Date()
      };
    }

    if (type === 'group.update') {
      const existing = groupMap[data.groupId];
      if (existing) {
        groupMap[data.groupId] = {
          ...existing,
          groupName: data.name || existing.groupName,
          description: data.description || existing.description,
          roles: data.roles || existing.roles,
          updatedAt: timestamp || createdAt || new Date()
        };
      }
    }

    if (type === 'group.role.add') {
        const existing = groupMap[data.groupId];
        if (existing) {
            if (!existing.roles) existing.roles = [];
            if (!existing.roles.includes(data.role)) {
            existing.roles.push(data.role);
            }
        }
        }

        if (type === 'group.role.remove') {
        const existing = groupMap[data.groupId];
        if (existing) {
            if (!existing.roles) existing.roles = [];
            existing.roles = existing.roles.filter(p => p !== data.role);
        }
        }
  }

  return groupMap;
};