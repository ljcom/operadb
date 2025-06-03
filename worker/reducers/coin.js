exports.replay = function (events) {
  let currentId = null;
  const stateMap = {};

  for (const event of events) {
    const { type, data, actor } = event;

    switch (type) {
      case 'coin.create': {
        if (data.coinId && data.coinId.startsWith('coin')) {
          currentId = data.coinId;
          stateMap[currentId] = {
            balances: {},
            allowance: {},
            totalSupply: data.totalSupply || 0,
            coinId: data.coinId,
            creator: data.creator || actor,
            entityType: 'coin'
          };

          // Optional: langsung isi balance jika `to` tersedia
          if (data.to && data.totalSupply > 0) {
            stateMap[currentId].balances[data.to] = data.totalSupply;
          }
        }
        break;
      }

      case 'coin.mint':
      case 'coin.burn':
      case 'coin.transfer':
      case 'coin.approve':
      case 'coin.transferFrom': {
        const id = data.coinId || currentId;
        if (!stateMap[id]) continue;

        const s = stateMap[id];
        switch (type) {
          case 'coin.mint': {
            const { to, amount } = data;
            s.balances[to] = (s.balances[to] || 0) + amount;
            s.totalSupply += amount;
            break;
          }
          case 'coin.burn': {
            const { from, amount } = data;
            if ((s.balances[from] || 0) >= amount) {
              s.balances[from] -= amount;
              s.totalSupply -= amount;
            }
            break;
          }
          case 'coin.transfer': {
            const { from, to, amount } = data;
            if ((s.balances[from] || 0) >= amount) {
              s.balances[from] -= amount;
              s.balances[to] = (s.balances[to] || 0) + amount;
            }
            break;
          }
          case 'coin.approve': {
            const { owner, spender, amount } = data;
            s.allowance[owner] = s.allowance[owner] || {};
            s.allowance[owner][spender] = amount;
            break;
          }
          case 'coin.transferFrom': {
            const { from, to, amount } = data;
            const spender = actor;
            const allowed = s.allowance[from]?.[spender] || 0;
            const balance = s.balances[from] || 0;

            if (allowed >= amount && balance >= amount) {
              s.allowance[from][spender] -= amount;
              s.balances[from] -= amount;
              s.balances[to] = (s.balances[to] || 0) + amount;
            }
            break;
          }
        }
        break;
      }
    }
  }

  return stateMap;
};