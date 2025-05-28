exports.replay = function (events) {
  const roleMap = {};

  for (const event of events) {
    const { type, data, timestamp, createdAt } = event;

    if (type === 'role.create') {
      roleMap[data.roleId] = {
        roleId: data.roleId,
        roleName: data.name,
        description: data.description || '',
        permissions: data.permissions || [],
        createdAt: timestamp || createdAt || new Date()
      };
    }

    if (type === 'role.update') {
      const existing = roleMap[data.roleId];
      if (existing) {
        roleMap[data.roleId] = {
          ...existing,
          roleName: data.name || existing.roleName,
          description: data.description || existing.description,
          permissions: data.permissions || existing.permissions,
          updatedAt: timestamp || createdAt || new Date()
        };
      }
    }

    if (type === 'role.permission.add') {
        const existing = roleMap[data.roleId];
        if (existing) {
            if (!existing.permissions) existing.permissions = [];
            if (!existing.permissions.includes(data.permission)) {
            existing.permissions.push(data.permission);
            }
        }
        }

        if (type === 'role.permission.remove') {
        const existing = roleMap[data.roleId];
        if (existing) {
            if (!existing.permissions) existing.permissions = [];
            existing.permissions = existing.permissions.filter(p => p !== data.permission);
        }
        }
  }

  return roleMap;
};