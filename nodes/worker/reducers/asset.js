exports.replay = function (events) {
  const state = {
    assetId: null,
    creator: null,
    holders: {},   // address → qty
    metadata: {},  // optional field
    totalQty: 0
  };

  for (const event of events) {
    const { type, data, actor } = event;

    switch (type) {
      case 'asset.mint': {
        const { assetId, to, qty, metadata } = data;


        if (!state.assetId) {
          state.assetId = assetId;
          state.creator = actor;
        }
        if (!qty || qty < 0) return state;

        const target = to || actor; // fallback ke actor jika to tidak diberikan
        state.holders[target] = (state.holders[target] || 0) + qty;
        
        state.totalQty += qty;

        if (metadata) {
          state.metadata = metadata;
        }
        break;
      }

      case 'asset.burn': {
        const { qty } = data;
        const from = actor;

        if (!qty || qty <= 0) break; // abaikan event burn tidak valid

        if ((state.holders[from] || 0) >= qty) {
          state.holders[from] -= qty;
          state.totalQty -= qty;
          if (state.holders[from] === 0) {
            delete state.holders[from];
          }
        }
        break;
      }

      case 'asset.transfer': {
        const { from, to, qty } = data;

        if (!qty || qty <= 0) break; // abaikan event burn tidak valid

        if ((state.holders[from] || 0) >= qty) {
          state.holders[from] -= qty;
          if (state.holders[from] === 0) {
            delete state.holders[from];
          }
          
          state.holders[to] = (state.holders[to] || 0) + qty;
        }
        break;
      }

      case 'asset.metadata': {
        if (metadata && Object.keys(state.metadata).length === 0) {
        state.metadata = metadata;
        }
        break;
      }
    }
  }

  return state;
};