exports.replay = function (events) {
  const state = {
    holders: {},  // { asset_id: { address: qty } }
    metadata: {}  // asset_id -> metadata
  };

  for (const event of events) {
    const { type, data, actor } = event;
    const { asset_id } = data;

    switch (type) {
      case 'asset.mint': {
        const { to, qty, metadata } = data;
        state.holders[asset_id] = state.holders[asset_id] || {};
        state.holders[asset_id][to] = (state.holders[asset_id][to] || 0) + qty;
        state.metadata[asset_id] = metadata || {};
        break;
      }

      case 'asset.burn': {
        const { qty } = data;
        const from = actor;
        if (state.holders[asset_id]?.[from] >= qty) {
          state.holders[asset_id][from] -= qty;
          if (state.holders[asset_id][from] === 0) {
            delete state.holders[asset_id][from];
          }
        }
        break;
      }

      case 'asset.transfer': {
        const { from, to, qty } = data;
        if (state.holders[asset_id]?.[from] >= qty) {
          state.holders[asset_id][from] -= qty;
          if (state.holders[asset_id][from] === 0) {
            delete state.holders[asset_id][from];
          }
          state.holders[asset_id][to] = (state.holders[asset_id][to] || 0) + qty;
        }
        break;
      }

      case 'asset.metadata': {
        state.metadata[asset_id] = data.metadata;
        break;
      }
    }
  }

  return state;
};