exports.replay = function (events) {
  const groupMap = {};

  for (const event of events) {
    const { type, data, timestamp, createdAt } = event;

    if (type === 'group.create') {
      groupMap[data.groupId] = {
        groupId: data.groupId,
        groupName: data.name,
        description: data.description || '',
        permissions: data.permissions || [],
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
          permissions: data.permissions || existing.permissions,
          updatedAt: timestamp || createdAt || new Date()
        };
      }
    }

    if (type === 'group.permission.add') {
        const existing = groupMap[data.groupId];
        if (existing) {
            if (!existing.permissions) existing.permissions = [];
            if (!existing.permissions.includes(data.permission)) {
            existing.permissions.push(data.permission);
            }
        }
        }

        if (type === 'group.permission.remove') {
        const existing = groupMap[data.groupId];
        if (existing) {
            if (!existing.permissions) existing.permissions = [];
            existing.permissions = existing.permissions.filter(p => p !== data.permission);
        }
        }
  }

  return groupMap;
};