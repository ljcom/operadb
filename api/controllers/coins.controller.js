const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { generateScopedId } = require('../utils/idNaming');

// POST /coins/create
exports.createCoin = async (req, res) => {
  try {
    const { symbol, decimals = 0, totalSupply, description } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    const coinId = await generateScopedId('coin', accountId, symbol.toLowerCase(), description || '');

    const isValid = await validateId(actor);
    if (!isValid) return res.status(400).json({ error: 'Invalid creator ID' });

    if (!totalSupply || totalSupply <= 0) {
      return res.status(400).json({ error: 'Invalid totalSupply' });
    }

    if (!decimals || decimals >= 0) {
      return res.status(400).json({ error: 'Invalid decimals' });
    }

    const event = await sendEvent({
      type: 'coin.create',
      data: { coin_id: coinId, symbol, decimals, total_supply: totalSupply, description, creator: actor },
      actor,
      account: null
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
    const actor = req.user.id;

    if (!coinId || !to || amount == null) {
      return res.status(400).json({ error: 'Missing coinId, to, or amount' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const [coinValid, toValid] = await Promise.all([
      validateId(coinId),
      validateId(to)
    ]);

    if (!coinValid) return res.status(400).json({ error: 'Invalid coin ID' });
    if (!toValid) return res.status(400).json({ error: 'Invalid recipient ID' });

    const result = await findFromGateway('states', {
      entityType: 'coin',
      entityId: coinId
    });

    const coinState = result?.[0];
    if (!coinState || coinState.creator !== actor) {
      return res.status(403).json({ error: 'Only coin creator can mint' });
    }

    const event = await sendEvent({
      type: 'coin.mint',
      data: { coin_id: coinId, to, amount },
      actor,
      account: null
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
    const actor = req.user.id;

    if (!coinId || amount == null) {
      return res.status(400).json({ error: 'Missing coinId or amount' });
    }

    const coinValid = await validateId(coinId);
    if (!coinValid) return res.status(400).json({ error: 'Invalid coin ID' });

    const result = await findFromGateway('states', {
      entityType: 'coin',
      entityId: coinId
    });

    const balance = result?.[0]?.holders?.[actor] || 0;
    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const event = await sendEvent({
      type: 'coin.burn',
      data: { coin_id: coinId, amount },
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
    const actor = req.user.id;

    if (!coinId || !to || amount == null) {
      return res.status(400).json({ error: 'Missing coinId, to, or amount' });
    }

    const [coinValid, toValid] = await Promise.all([
      validateId(coinId),
      validateId(to)
    ]);

    if (!coinValid) return res.status(400).json({ error: 'Invalid coin ID' });
    if (!toValid) return res.status(400).json({ error: 'Invalid recipient ID' });

    const result = await findFromGateway('states', {
      entityType: 'coin',
      entityId: coinId
    });

    const balance = result?.[0]?.holders?.[actor] || 0;
    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const event = await sendEvent({
      type: 'coin.transfer',
      data: { coin_id: coinId, from: actor, to, amount },
      actor,
      account: null
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
    const actor = req.user.id;

    if (!coinId || !spender || amount == null) {
      return res.status(400).json({ error: 'Missing coinId, spender, or amount' });
    }

    const [coinValid, spenderValid] = await Promise.all([
      validateId(coinId),
      validateId(spender)
    ]);

    if (!coinValid) return res.status(400).json({ error: 'Invalid coin ID' });
    if (!spenderValid) return res.status(400).json({ error: 'Invalid spender ID' });

    const event = await sendEvent({
      type: 'coin.approve',
      data: { coin_id: coinId, owner: actor, spender, amount },
      actor,
      account: null
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
    const actor = req.user.id; // spender

    if (!coinId || !from || !to || amount == null) {
      return res.status(400).json({ error: 'Missing coinId, from, to, or amount' });
    }

    const [coinValid, fromValid, toValid] = await Promise.all([
      validateId(coinId),
      validateId(from),
      validateId(to)
    ]);

    if (!coinValid) return res.status(400).json({ error: 'Invalid coin ID' });
    if (!fromValid || !toValid) return res.status(400).json({ error: 'Invalid from/to ID' });

    const result = await findFromGateway('states', {
      entityType: 'coin',
      entityId: coinId
    });

    const allowance = result?.[0]?.allowance?.[from]?.[actor] || 0;
    if (allowance < amount) {
      return res.status(400).json({ error: 'Insufficient allowance' });
    }

    const event = await sendEvent({
      type: 'coin.transferFrom',
      data: { coin_id: coinId, from, to, amount },
      actor,
      account: null
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
      entityId: coinId
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
      entityId: id
    });

    const coin = result?.[0];
    if (!coin) return res.status(404).json({ error: 'Coin not found' });

    const totalSupply = Object.values(coin.holders || {}).reduce((sum, qty) => sum + qty, 0);
    res.status(200).json({
      coin_id: id,
      symbol: coin.symbol,
      decimals: coin.decimals,
      description: coin.description || '',
      total_supply: totalSupply
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
          coin_id: state.entityId,
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
      coin_id: state.entityId,
      symbol: state.symbol,
      totalQty: state.totalQty || 0
    }));

    res.status(200).json({ supplies });
  } catch (err) {
    console.error('Get total supply failed:', err.message);
    res.status(500).json({ error: 'Failed to get total supply' });
  }
};