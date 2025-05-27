exports.replay = function (events) {
  const state = {
    contractId: null,
    contractType: null,
    schemaId: null,
    data: {},
    from: null,
    to: null,
    subject: null,
    status: 'draft',
    visibility: 'internal',
    metadata: {},
    createdBy: null
  };

  for (const event of events) {
    if (event.type === 'contract.create') {
      const d = event.data;
      state.contractId = d.contract_id;
      state.contractType = d.contract_type;
      state.schemaId = d.schema_id;
      state.data = d.data;
      state.from = d.from;
      state.to = d.to;
      state.subject = d.subject || null;
      state.status = d.status || 'draft';
      state.visibility = d.visibility || 'internal';
      state.metadata = d.metadata || {};
      state.createdBy = event.actor;
    }
  }

  return state;
};