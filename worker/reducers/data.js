exports.replay = function (events) {
  const state = {
    dataId: null,
    type: [],
    visibility: 'private',
    issuer: null,
    owner: null,
    content: {},
    datatype: {}
  };

  for (const event of events) {
    const { type, data, actor } = event;

    if (type === 'data.issue') {
      state.dataId = data.dataId;
      state.owner = data.owner;
      state.type = data.type || ['VerifiableCredential'];
      state.visibility = data.visibility || 'private';
      state.content = data.content || {};
      state.datatype = data.datatype || {};
      state.issuer = actor;
    } else if (type === 'data.revoke') {
        const { dataId } = data;
        const state = getOrInit(dataId);
        state.revoked = true;
        state.revokeReason = data.reason || null;
        state.revokedAt = timestamp;
    }

  }

  return state;
};