exports.replay = function (events) {
  const schemaMap = {};

  for (const e of events) {
    if (e.type === 'schema.create') {
      const id = e.data.schemaId;
      schemaMap[id] = {
        schemaId: id,
        format_type: e.data.format_type || 'contract',
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