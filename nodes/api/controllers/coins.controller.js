const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { generateScopedId, validateId, isValidAddressFormat } = require('../utils/idNaming');

// POST /coins/create
exports.createCoin = async (req, res) => {
  try {
    const { symbol, decimals = 0, totalSupply, description, to } = req.body;
    const actor = req.address;
    const accountId = req.accountId;

    // 1) Validasi required fields
    if (!symbol || !totalSupply) {
      return res.status(400).json({ error: 'Missing symbol or totalSupply' });
    }
    const coinId = await generateScopedId('coin', accountId.split(':')[1], 'coin', 
      symbol.toLowerCase(), description || '');

    // 2) Cek uniqueness symbol per account
    const allCoins = await findFromGateway('states', {
      entityType: 'coin',
      account: accountId
    });
    if (allCoins.some(c => c.refId.toLowerCase() === coinId.toLowerCase())) {
      return res
        .status(409)
        .json({ error: `Coin with symbol "${symbol}" already exists in this account` });
    }

    let recipient = to;
    if (!recipient) {
      const accState = await findFromGateway('states', {
        entityType: 'account',
        refId: accountId
      });

      if (!accState.length || !accState[0].state?.address) {
        return res.status(400).json({ error: 'Cannot determine recipient (owner missing)' });
      }

      recipient = accState[0].state.address;
    }


    //const isValid = await validateId(actor);
    //if (!isValid) return res.status(400).json({ error: 'Invalid creator ID' });

    if (!totalSupply || totalSupply <= 0) {
      return res.status(400).json({ error: 'Invalid totalSupply' });
    }

    if (!decimals || decimals < 0) {
      return res.status(400).json({ error: 'Invalid decimals' });
    }
    if (recipient && !isValidAddressFormat(recipient)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    const event = await sendEvent({
      type: 'coin.create',
      data: { coinId, symbol, decimals, totalSupply, description, to: recipient },
      actor,
      account: accountId
      
    });

    res.status(201).json({ message: 'Coin created', event: event.data });
  } catch (err) {
    console.error('Create coin failed:', err.message);
    res.status(500).json({ error: 'Create coin failed' });
  }
};

// POST /coins/mint
exports.mintCoin = async (req, res) => {
  try {
    const { coinId, to, amount } = req.body;
    const actor = req.address;
    const accountId = req.accountId;

    if (!coinId || !to || amount == null) {
      return res.status(400).json({ error: 'Missing coinId, to, or amount' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const [coinValid, toValid] = await Promise.all([
      validateId(coinId),
      isValidAddressFormat(to)
    ]);

    if (!coinValid) return res.status(400).json({ error: 'Invalid coin ID' });
    if (!toValid) return res.status(400).json({ error: 'Invalid recipient ID' });

    const result = await findFromGateway('states', {
      entityType: 'coin',
      refId: coinId
    });

    const coinState = result?.[0].state[coinId];
    if (!coinState || coinState.creator.toLowerCase() !== actor.toLowerCase()) {
      return res.status(403).json({ error: 'Only coin creator can mint' });
    }
    if (to && !isValidAddressFormat(to)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    const event = await sendEvent({
      type: 'coin.mint',
      data: { coinId, to, amount },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Minted successfully', event: event.data });
  } catch (err) {
    console.error('Mint failed:', err.message);
    res.status(500).json({ error: 'Mint failed' });
  }
};

// POST /coins/burn
exports.burnCoin = async (req, res) => {
  try {
    const { coinId, amount } = req.body;
    const actor = req.address;
    const accountId = req.accountId;

    if (!coinId || amount == null) {
      return res.status(400).json({ error: 'Missing coinId or amount' });
    }

    const coinValid = await validateId(coinId);
    if (!coinValid) return res.status(400).json({ error: 'Invalid coin ID' });

    const result = await findFromGateway('states', {
      entityType: 'coin',
      refId: coinId
    });

    const rawBalances=result.filter(e=>e.refId=coinId)[0].state[coinId].balances;
    //const rawBalances = result?.[0]?.state[result?.[0].refId].balances || {};
    const balances = Object.entries(rawBalances).reduce((map, [addr, bal]) => {
      map[addr.toLowerCase()] = bal;
      return map;
    }, {});

    const balance = balances[actor.toLowerCase()] || 0;
    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const event = await sendEvent({
      type: 'coin.burn',
      data: { coinId, amount },
      actor,
      account: null
    });

    res.status(200).json({ message: 'Burned', event: event.data });
  } catch (err) {
    console.error('Burn failed:', err.message);
    res.status(500).json({ error: 'Burn failed' });
  }
};

// POST /coins/transfer
exports.transferCoin = async (req, res) => {
  try {
    const { coinId, to, amount } = req.body;
    const actor = req.address;
    const accountId = req.accountId;

    if (!coinId || !to || amount == null) {
      return res.status(400).json({ error: 'Missing coinId, to, or amount' });
    }

    const [coinValid, toValid] = await Promise.all([
      validateId(coinId),
      isValidAddressFormat(to)
    ]);

    if (!coinValid) return res.status(400).json({ error: 'Invalid coin ID' });
    if (!toValid) return res.status(400).json({ error: 'Invalid recipient ID' });

    const result = await findFromGateway('states', {
      entityType: 'coin',
      refId: coinId
    });
    const rawBalances=result.filter(e=>e.refId=coinId)[0].state[coinId].balances;
    //const rawBalances = result?.[0]?.state[result?.[0].refId].balances || {};
    const balances = Object.entries(rawBalances).reduce((map, [addr, bal]) => {
      map[addr.toLowerCase()] = bal;
      return map;
    }, {});

    const balance = balances[actor.toLowerCase()] || 0;

    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    if (to && !isValidAddressFormat(to)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    const event = await sendEvent({
      type: 'coin.transfer',
      data: { coinId, from: actor, to, amount },
      actor,
      account: accountId 
    });

    res.status(200).json({ message: 'Transferred', event: event.data });
  } catch (err) {
    console.error('Transfer failed:', err.message);
    res.status(500).json({ error: 'Transfer failed' });
  }
};

// POST /coins/approve
exports.approveSpender = async (req, res) => {
  try {
    const { coinId, spender, amount } = req.body;
    const actor = req.address;
    const accountId = req.accountId;

    if (!coinId || !spender || amount == null) {
      return res.status(400).json({ error: 'Missing coinId, spender, or amount' });
    }

    const [coinValid, spenderValid] = await Promise.all([
      validateId(coinId),
      isValidAddressFormat(spender)
    ]);

    if (!coinValid) return res.status(400).json({ error: 'Invalid coin ID' });
    if (!spenderValid) return res.status(400).json({ error: 'Invalid spender ID' });
    if (actor && !isValidAddressFormat(actor)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    const event = await sendEvent({
      type: 'coin.approve',
      data: { coinId, owner: actor, spender, amount },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Spender approved', event: event.data });
  } catch (err) {
    console.error('Approve failed:', err.message);
    res.status(500).json({ error: 'Approve failed' });
  }
};

// POST /coins/transfer-from
exports.transferFromCoin = async (req, res) => {
  try {
    const { coinId, from, to, amount } = req.body;
    const actor = req.address; // spender
    const accountId = req.accountId;

    if (!coinId || !from || !to || amount == null) {
      return res.status(400).json({ error: 'Missing coinId, from, to, or amount' });
    }

    const [coinValid, fromValid, toValid] = await Promise.all([
      validateId(coinId),
      isValidAddressFormat(from),
      isValidAddressFormat(to)
    ]);

    if (!coinValid) return res.status(400).json({ error: 'Invalid coin ID' });
    if (!fromValid || !toValid) return res.status(400).json({ error: 'Invalid from/to ID' });

    const result = await findFromGateway('states', {
      entityType: 'coin',
      refId: coinId
    });

    const allowance = result?.[0]?.allowance?.[from]?.[actor] || 0;
    if (allowance < amount) {
      return res.status(400).json({ error: 'Insufficient allowance' });
    }
    if (to && !isValidAddressFormat(to)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    const event = await sendEvent({
      type: 'coin.transferFrom',
      data: { coinId, from, to, amount },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'TransferFrom successful', event: event.data });
  } catch (err) {
    console.error('TransferFrom failed:', err.message);
    res.status(500).json({ error: 'TransferFrom failed' });
  }
};

// GET /coins/allowance/:owner/:spender?coinId=...
exports.getAllowance = async (req, res) => {
  try {
    const { owner, spender } = req.params;
    const { coinId } = req.query;

    if (!coinId || !owner || !spender) {
      return res.status(400).json({ error: 'Missing coinId, owner, or spender' });
    }

    const result = await findFromGateway('states', {
      entityType: 'coin',
      refId: coinId
    });

    const allowance = result?.[0]?.allowance?.[owner]?.[spender] || 0;
    res.status(200).json({ coinId, owner, spender, allowance });
  } catch (err) {
    console.error('Get allowance failed:', err.message);
    res.status(500).json({ error: 'Failed to get allowance' });
  }
};

// GET /coins/:id
exports.getCoinMetadata = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await findFromGateway('states', {
      entityType: 'coin',
      refId: id
    });

    const coin = result?.[0];
    if (!coin) return res.status(404).json({ error: 'Coin not found' });

    const totalSupply = Object.values(coin.holders || {}).reduce((sum, qty) => sum + qty, 0);
    res.status(200).json({
      coinId: id,
      symbol: coin.symbol,
      decimals: coin.decimals,
      description: coin.description || '',
      totalSupply
    });
  } catch (err) {
    console.error('Get coin metadata failed:', err.message);
    res.status(500).json({ error: 'Failed to get coin metadata' });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Ambil semua asset tipe 'coin'
    const coinStates = await findFromGateway('states', {
      entityType: 'coin'
    });

    const balances = coinStates
      .map(state => {
        const qty = state.holders?.[address] || 0;
        return {
          coinId: state.entityId,
          symbol: state.symbol,
          balance: qty
        };
      })
      .filter(c => c.balance > 0);

    res.status(200).json({ address, balances });
  } catch (err) {
    console.error('Get balance failed:', err.message);
    res.status(500).json({ error: 'Failed to get balance' });
  }
};

exports.getTotalSupply = async (req, res) => {
  try {
    const coinStates = await findFromGateway('states', {
      entityType: 'coin'
    });

    const supplies = coinStates.map(state => ({
      coinId: state.entityId,
      symbol: state.symbol,
      totalQty: state.totalQty || 0
    }));

    res.status(200).json({ supplies });
  } catch (err) {
    console.error('Get total supply failed:', err.message);
    res.status(500).json({ error: 'Failed to get total supply' });
  }
};