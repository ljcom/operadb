exports.replay = function (events) {
  const schemas = [];

  for (const e of events) {
    if (e.type === 'schema.create') {
      schemas.push({
        schemaId: e.data.schemaId,
        description: e.data.description,
        fields: e.data.fields,
        reducerCode: e.data.reducerCode,
        version: e.data.version,
        createdAt: e.timestamp || e.createdAt || new Date()
      });
    }
  }

  return { schemas };
};