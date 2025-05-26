exports.replay = function (events) {
  const state = {
    balances: {},
    allowance: {},
    totalSupply: 0,
    coinId: null,
    creator: null
  };

  for (const event of events) {
    const { type, data, actor } = event;

    switch (type) {
      case 'coin.create': {
        if (data.coinId && data.coinId.startsWith('coin')) {
          state.coinId = data.coinId;
          state.creator = data.creator || actor;
        }
        break;
      }

      case 'coin.mint': {
        const { to, amount } = data;
        state.balances[to] = (state.balances[to] || 0) + amount;
        state.totalSupply += amount;
        break;
      }

      case 'coin.burn': {
        const { from, amount } = data;
        if ((state.balances[from] || 0) >= amount) {
          state.balances[from] -= amount;
          state.totalSupply -= amount;
        }
        break;
      }

      case 'coin.transfer': {
        const { from, to, amount } = data;
        if ((state.balances[from] || 0) >= amount) {
          state.balances[from] -= amount;
          state.balances[to] = (state.balances[to] || 0) + amount;
        }
        break;
      }

      case 'coin.approve': {
        const { owner, spender, amount } = data;
        state.allowance[owner] = state.allowance[owner] || {};
        state.allowance[owner][spender] = amount;
        break;
      }

      case 'coin.transferFrom': {
        const { from, to, amount } = data;
        const spender = actor;
        const allowed = state.allowance[from]?.[spender] || 0;
        const balance = state.balances[from] || 0;

        if (allowed >= amount && balance >= amount) {
          state.allowance[from][spender] -= amount;
          state.balances[from] -= amount;
          state.balances[to] = (state.balances[to] || 0) + amount;
        }
        break;
      }
    }
  }

  return state;
};