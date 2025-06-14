const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { generateId, parseId, generateScopedId, isValidAddressFormat } = require('../utils/idNaming');

// 1. Mint asset
exports.mintAsset = async (req, res) => {
  try {
    const { assetId, to, qty, schemaId } = req.body;
    const actor = req.address;
    const accountId = req.accountId;

    // Validasi awal wajib
    if (!schemaId) {
      return res.status(400).json({ error: 'Missing required field: schemaId' });
    }
    const schemaId1 = await generateScopedId('mod', accountId.split(':')[1], 'schema', schemaId);
    // Ambil schema dari gateway
    const schemaRes = await findFromGateway('states', {
      entityType: 'schema',
      refId: schemaId1,
      account: accountId
    });

    const schema = schemaRes?.[0];
    if (!schema) {
      return res.status(400).json({ error: 'Invalid schemaId or not for asset' });
    }

    const type = schemaId1.split(':')[2];

    // Validasi field metadata terhadap schema.fields
    const fields = schema.state[schemaId1].fields || [];
    for (const field of fields) {
      if (field.required && (field.name === undefined || field.name === null)) {
        return res.status(400).json({ error: `Missing required field in metadata: ${field.name}` });
      }
    }

    // Generate assetId
    const assetId1 = await generateScopedId('obj', accountId.split(':')[1], 'asset', type, assetId);

    const fullEntityType = schema.state[schemaId1]?.entityType;
    if (!['asset.unique', 'asset.commodity', 'actor.people'].includes(fullEntityType)) {
      return res.status(400).json({ error: 'Invalid entityType for minting' });
    }

    let qty1 = null;


    if (fullEntityType === 'asset.unique') {
      if ( qty > 1) {
        return res.status(400).json({ error: 'unique mode requires qty = 1' });
      }
      qty1 = 1;
    }

    if (fullEntityType === 'asset.commodity') {
      if ( qty == null || qty < 0) {
        return res.status(400).json({ error: 'commodity mode requires qty > 0' });
      }
      qty1 = qty;
    }

    const existing = await findFromGateway('states', {
        entityType: 'asset',
        entityId: assetId
    });

    if (existing?.length) {
        return res.status(400).json({ error: 'Mint qty = 0 only allowed when creating new asset' });
    }

    // Validasi to jika ada
    if (to) {
      const toParsed = parseId(to);
      if (!toParsed || !['user', 'account'].includes(toParsed.type)) {
        return res.status(400).json({ error: 'Invalid "to" format. Expected user: or account:' });
      }
    }
    if (to && !isValidAddressFormat(to)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    // Kirim event
    const result = await sendEvent({
      type: 'asset.mint',
      data: {
        assetId:assetId1,
        schemaId,
        type,
        qty: qty1,
        to
      },
      actor,
      account: accountId
    });

    res.status(201).json({ message: 'Asset minted', event: result.data });

  } catch (err) {
    console.error('Mint asset failed:', err.message);
    res.status(500).json({ error: 'Mint asset failed' });
  }
};

// 2. Burn asset
exports.burnAsset = async (req, res) => {
  try {
    const { assetId, qty } = req.body;
    const actor = req.address;

    if (!assetId) return res.status(400).json({ error: 'Missing assetId' });

    const stateRes = await findFromGateway('states', {
      entityType: 'asset',
      entityId: assetId
    });

    const state = stateRes?.[0];
    const ownedQty = state?.holders?.[actor] || 0;

    if (qty && ownedQty < qty) {
      return res.status(400).json({ error: 'Insufficient quantity to burn' });
    }

    if (qty != null && qty <= 0) {
        return res.status(400).json({ error: 'Burn qty must be > 0' });
    }

    if (!qty && ownedQty <= 0) {
      return res.status(400).json({ error: 'You do not own this asset' });
    }
    if (actor && !isValidAddressFormat(actor)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }

    const result = await sendEvent({
      type: 'asset.burn',
      data: { assetId, qty: qty || 1 },
      actor,
      account: null
    });

    res.status(200).json({ message: 'Asset burned', event: result.data });
  } catch (err) {
    console.error('Burn asset failed:', err.message);
    res.status(500).json({ error: 'Burn asset failed' });
  }
};

// 3. Transfer asset
exports.transferAsset = async (req, res) => {
  try {
    const { assetId, to, qty } = req.body;
    const actor = req.address;

    if (!assetId || !to) return res.status(400).json({ error: 'Missing assetId or to' });

    const toParsed = parseId(to);
    if (!toParsed || !['user', 'account'].includes(toParsed.type)) {
      return res.status(400).json({ error: 'Invalid "to" ID format' });
    }

    const stateRes = await findFromGateway('states', {
      entityType: 'asset',
      entityId: assetId
    });

    const state = stateRes?.[0];
    const ownedQty = state?.holders?.[actor] || 0;

    if (!qty && ownedQty <= 0) {
      return res.status(400).json({ error: 'You do not own this asset' });
    }

    if (qty && ownedQty < qty) {
      return res.status(400).json({ error: 'Insufficient quantity to transfer' });
    }

    if (qty != null && qty <= 0) {
        return res.status(400).json({ error: 'Transfer qty must be > 0' });
    }
    if (to && !isValidAddressFormat(to)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    const result = await sendEvent({
      type: 'asset.transfer',
      data: { assetId, from: actor, to, qty: qty || 1 },
      actor,
      account: null
    });

    res.status(200).json({ message: 'Asset transferred', event: result.data });
  } catch (err) {
    console.error('Transfer asset failed:', err.message);
    res.status(500).json({ error: 'Transfer asset failed' });
  }
};

// 4. Get assets owned by an address
exports.getOwnedAssets = async (req, res) => {
  try {
    const { address } = req.params;

    const parsed = parseId(address);
    if (!parsed || !['user', 'account'].includes(parsed.type)) {
      return res.status(400).json({ error: 'Invalid address format. Expected user: or account:' });
    }

    const result = await findFromGateway('states', {
      entityType: 'asset'
    });

    const allAssets = result || [];
    const owned = [];

    for (const state of allAssets) {
      const qty = state.holders?.[address] || 0;
      if (qty > 0) {
        owned.push({
          assetId: state.entityId,
          qty,
          metadata: state.metadata || {}
        });
      }
    }

    res.status(200).json({ address, assets: owned });
  } catch (err) {
    console.error('Get owned assets failed:', err.message);
    res.status(500).json({ error: 'Failed to get owned assets' });
  }
};

// 5. Get metadata for a specific asset
exports.getAssetMetadata = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await findFromGateway('states', {
      entityType: 'asset',
      entityId: id
    });

    const asset = result?.[0];
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.status(200).json({
      assetId: id,
      metadata: asset.metadata || {},
      holders: asset.holders || {}
    });
  } catch (err) {
    console.error('Get asset metadata failed:', err.message);
    res.status(500).json({ error: 'Failed to get asset metadata' });
  }
};