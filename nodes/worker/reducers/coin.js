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
            creator: (data.creator || actor).toLowerCase(),
            entityType: 'coin'
          };

          // Optional: langsung isi balance jika `to` tersedia
          if (data.to && data.totalSupply > 0) {
            const toAddr = data.to.toLowerCase();
            stateMap[currentId].balances[toAddr] = data.totalSupply;
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
            const toAddr = data.to.toLowerCase();
            s.balances[toAddr] = (s.balances[toAddr] || 0) + data.amount;
            s.totalSupply += data.amount;
            break;
          }
          case 'coin.burn': {
            const fromAddr = data.from.toLowerCase();
            if ((s.balances[fromAddr] || 0) >= data.amount) {
              s.balances[fromAddr] -= data.amount;
              s.totalSupply -= data.amount;
            }
            break;
          }
          case 'coin.transfer': {
            const fromAddr = data.from.toLowerCase();
            const toAddr   = data.to.toLowerCase();
            if ((s.balances[fromAddr] || 0) >= data.amount) {
              s.balances[fromAddr] -= data.amount;
              s.balances[toAddr] = (s.balances[toAddr] || 0) + data.amount;
            }
            break;
          }
          case 'coin.approve': {
            const ownerAddr   = data.owner.toLowerCase();
            const spenderAddr = data.spender.toLowerCase();
            s.allowance[ownerAddr] = s.allowance[ownerAddr] || {};
            s.allowance[ownerAddr][spenderAddr] = data.amount;
            break;
          }
          case 'coin.transferFrom': {
            const fromAddr    = data.from.toLowerCase();
            const toAddr      = data.to.toLowerCase();
            const spenderAddr = actor.toLowerCase();
            const allowed     = s.allowance[fromAddr]?.[spenderAddr] || 0;
            const balance     = s.balances[fromAddr] || 0;

            if (allowed >= data.amount && balance >= data.amount) {
              s.allowance[fromAddr][spenderAddr] -= data.amount;
              s.balances[fromAddr] -= data.amount;
              s.balances[toAddr] = (s.balances[toAddr] || 0) + data.amount;
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