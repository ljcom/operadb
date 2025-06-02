exports.replay = function (events) {
  const state = {
    actorId: null,
    accountId: null,
    role: null,           // optional: customer, vendor, dsb
    represented: null,    // optional: org:corporateX
    pic: [],              // array of userId atau org:user:xxx
    address: null,        // public address
    metadata: {}
  };

  for (const event of events) {
    const { type, data, actor } = event;

    switch (type) {
      case 'actor.register': {
        const { actorId, accountId, role, represented, pic, address, metadata } = data;

        state.actorId = actorId;
        state.accountId = accountId;
        state.role = role || null;
        state.represented = represented || null;
        state.pic = Array.isArray(pic) ? [...pic] : [];
        state.address = address || null;
        state.metadata = metadata || {};
        break;
      }

      case 'actor.update': {
        const { role, represented, pic, address, metadata } = data;

        if (role !== undefined) state.role = role;
        if (represented !== undefined) state.represented = represented;
        if (pic !== undefined) state.pic = Array.isArray(pic) ? [...pic] : state.pic;
        if (address !== undefined) state.address = address;
        if (metadata !== undefined) {
          state.metadata = {
            ...state.metadata,
            ...metadata
          };
        }
        break;
      }
    }
  }

  return state;
};