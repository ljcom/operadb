const { sendEvent } = require('../utils/eventSender');
const { generateId } = require('../utils/idNaming');
const { findFromGateway } = require('../utils/gatewayQuery');

// 1. Buat schema coin
exports.createCoin = async (req, res) => {
  try {
    const { description, fields, reducerCode, version, initialSupply, to } = req.body;
    const accountId = req.accountId;
    const actor = req.user.id;

    if (!description || !fields || !reducerCode || !initialSupply || !to) {
      return res.status(400).json({ error: 'Missing required fields (desc, code, supply, to)' });
    }

    // Validasi account creator jika accountId dicantumkan
    if (accountId) {
        const result = await findFromGateway('states', {
            entityType: 'account',
            entityId: accountId
        });

        const accountState = result?.[0];
        if (!accountState || accountState.creator !== actor) {
            return res.status(403).json({ error: 'You are not the creator of this account' });
        }
    }
    

    const coinId = generateId('coin', { description, fields, reducerCode, version });

    // 1. Submit schema.create
    const schemaEvent = await sendEvent({
      type: 'coin.create',
      data: {
        coinId,
        description,
        fields,
        reducerCode,
        version,
        creator: actor
      },
      account: accountId || null,
      actor
    });

    // 2. Mint initial supply
    const mintEvent = await sendEvent({
      type: 'coin.mint',
      data: {
        to,
        amount: initialSupply,
        coinId
      },
      account: accountId || null,
      actor
    });

    res.status(201).json({
      message: 'Coin created with initial mint',
      coinId,
      schemaEvent: schemaEvent.data,
      mintEvent: mintEvent.data
    });

  } catch (err) {
    console.error('Failed to create coin:', err.message);
    res.status(500).json({ error: 'Failed to create coin' });
  }
};

// 2. Mint coin
exports.mintCoin = async (req, res) => {
  try {
    const { to, amount, coinId } = req.body;
    const actor = req.user.id;

    if (!to || !amount || !coinId) {
      return res.status(400).json({ error: 'Missing "to", "amount", or "coinId"' });
    }

    // Ambil state dari coin schema
    const result = await findFromGateway('states', {
      entityType: 'coin',
      entityId: coinId
    });

    const coinState = result?.[0];
    if (!coinState || coinState.creator !== actor) {
      return res.status(403).json({ error: 'Only the creator of this coin can mint' });
    }

    const event = await sendEvent({
      type: 'coin.mint',
      data: { to, amount, coinId },
      actor,
      account: null
    });

    res.status(200).json({ message: 'Coin minted', event: event.data });
  } catch (err) {
    console.error('Mint failed:', err.message);
    res.status(500).json({ error: 'Mint failed' });
  }
};

// 3. Burn coin
exports.burnCoin = async (req, res) => {
  try {
    const { amount } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    if (!amount) return res.status(400).json({ error: 'Missing "amount"' });

    // 🔍 Cek balance actor dulu via state
    const result = await findFromGateway('states', {
      entityType: 'coin',
      entityId: req.body.coinId  // Pastikan coinId disertakan di request
    });

    const coinState = result?.[0];
    const currentBalance = coinState?.balances?.[actor] || 0;

    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance to burn' });
    }

    const event = await sendEvent({
      type: 'coin.burn',
      data: { from: actor, amount },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Coin burned', event: event.data });
  } catch (err) {
    console.error('Burn failed:', err.message);
    res.status(500).json({ error: 'Burn failed' });
  }
};

// 4. Transfer coin
exports.transferCoin = async (req, res) => {
  try {
    const { to, amount } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    if (!to || !amount) return res.status(400).json({ error: 'Missing "to" or "amount"' });

    const result = await findFromGateway('states', {
      entityType: 'coin',
      entityId: coinId
    });

    const coinState = result?.[0];
    const balance = coinState?.balances?.[actor] || 0;

    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance to transfer' });
    }

    const event = await sendEvent({
      type: 'coin.transfer',
      data: { from: actor, to, amount },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Transfer successful', event: event.data });
  } catch (err) {
    console.error('Transfer failed:', err.message);
    res.status(500).json({ error: 'Transfer failed' });
  }
};

// 5. Ambil saldo
exports.getBalance = async (req, res) => {
  try {
    const address = req.params.address;
    const accountId = req.accountId;

    const result = await sendEvent({
      type: 'coin.balance',
      data: { address },
      actor: req.user.id,
      account: accountId
    });

    res.status(200).json({ address, balance: result.data.balance });
  } catch (err) {
    console.error('Get balance failed:', err.message);
    res.status(500).json({ error: 'Get balance failed' });
  }
};

// 6. Total supply
exports.getTotalSupply = async (req, res) => {
  try {
    const accountId = req.accountId;

    const result = await sendEvent({
      type: 'coin.supply',
      data: {},
      actor: req.user.id,
      account: accountId
    });

    res.status(200).json({ totalSupply: result.data.totalSupply });
  } catch (err) {
    console.error('Get supply failed:', err.message);
    res.status(500).json({ error: 'Get supply failed' });
  }
};

// 7. Approve spender
exports.approveSpender = async (req, res) => {
  try {
    const { spender, amount } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    if (!spender || !amount) return res.status(400).json({ error: 'Missing "spender" or "amount"' });

    const result = await findFromGateway('states', {
      entityType: 'coin',
      entityId: coinId
    });

    const coinState = result?.[0];
    const balance = coinState?.balances?.[actor] || 0;

    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance to approve this amount' });
    }

    const event = await sendEvent({
      type: 'coin.approve',
      data: { owner: actor, spender, amount },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Spender approved', event: event.data });
  } catch (err) {
    console.error('Approve failed:', err.message);
    res.status(500).json({ error: 'Approve failed' });
  }
};

// 8. Transfer token from an approved account
exports.transferFromCoin = async (req, res) => {
  try {
    const { from, to, amount } = req.body;
    const actor = req.user.id; // spender
    const accountId = req.accountId;

    if (!from || !to || !amount) {
      return res.status(400).json({ error: 'Missing from, to, or amount' });
    }

    const result = await findFromGateway('states', {
      entityType: 'coin',
      entityId: coinId
    });

    const coinState = result?.[0];
    const balance = coinState?.balances?.[from] || 0;
    const allowance = coinState?.allowance?.[from]?.[actor] || 0;

    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance of owner' });
    }

    if (allowance < amount) {
      return res.status(400).json({ error: 'Allowance exceeded for this spender' });
    }

    const event = await sendEvent({
      type: 'coin.transferFrom',
      data: { from, to, amount },
      actor,             // spender
      account: accountId
    });

    res.status(200).json({ message: 'Transfer from approved balance successful', event: event.data });
  } catch (err) {
    console.error('TransferFrom failed:', err.message);
    res.status(500).json({ error: 'TransferFrom failed' });
  }
};

// 9. Lihat allowance
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

    const coinState = result?.[0];
    const allowance = coinState?.allowance?.[owner]?.[spender] || 0;

    res.status(200).json({ owner, spender, allowance });
  } catch (err) {
    console.error('Get allowance failed:', err.message);
    res.status(500).json({ error: 'Get allowance failed' });
  }
};

// 10. Get coin metadata by ID
exports.getCoinMetadata = async (req, res) => {
  const coinId = req.params.id;
  try {
    const db = require('../db/mongo-client');
    const schema = await db.collection("schemas").findOne({ _id: coinId });

    if (!schema) return res.status(404).json({ error: "Coin not found" });

    const supplyEvent = await sendEvent({
      type: 'coin.supply',
      data: {},
      actor: req.user.id,
      account: schema.account || req.accountId
    });

    res.json({
      coin_id: coinId,
      name: schema.data?.fields?.name || "Unknown",
      symbol: schema.data?.fields?.symbol || "-",
      decimals: schema.data?.fields?.decimal || 0,
      totalSupply: supplyEvent.data?.totalSupply || 0,
      createdBy: schema.actor,
      createdAt: schema.createdAt
    });
  } catch (err) {
    console.error('Get coin metadata failed:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
};
