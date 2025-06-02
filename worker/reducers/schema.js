exports.replay = function (events) {
  const schemaMap = {};

  for (const e of events) {
    if (e.type === 'schema.create') {
      const id = e.data.schemaId;
      schemaMap[id] = {
        schemaId: id,
        //formatType: e.data.formatType || 'contract',
        entityType: e.data.entityType,
        description: e.data.description,
        fields: e.data.fields,
        reducerCode: e.data.reducerCode,
        version: e.data.version,
        workflow: e.data.workflow || [],
        createdAt: e.timestamp || e.createdAt || new Date()
      };
    }
  }

  return schemaMap;
};