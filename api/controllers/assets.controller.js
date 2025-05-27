const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { generateId, parseId } = require('../utils/idNaming');

// 1. Mint asset
exports.mintAsset = async (req, res) => {
  try {
    const { to, type, asset_mode, qty, metadata, schemaId } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    // Validasi awal wajib
    if (!schemaId || !type || !asset_mode) {
      return res.status(400).json({ error: 'Missing required fields: schemaId, type, asset_mode' });
    }

    // Ambil dan validasi schema milik account ini
    const schemaRes = await findFromGateway('states', {
      entityType: 'schema',
      entityId: schemaId,
      account: accountId
    });

    const schema = schemaRes?.[0];
    if (!schema || schema.entityType !== 'asset') {
      return res.status(400).json({ error: 'Invalid schemaId or not for asset' });
    }

    // Validasi field metadata terhadap schema.fields
    const fields = schema.fields || [];
    for (const field of fields) {
      if (field.required && (metadata?.[field.name] === undefined || metadata[field.name] === null)) {
        return res.status(400).json({ error: `Missing required field in metadata: ${field.name}` });
      }
    }

    // Generate asset_id
    const asset_id = await generateScopedId('obj', accountId, type, metadata?.name || actor);

    // Validasi berdasarkan asset_mode
    if (!['actor', 'unique', 'commodity'].includes(asset_mode)) {
      return res.status(400).json({ error: 'Invalid asset_mode: must be actor, unique, or commodity' });
    }

    if (asset_mode === 'actor') {
      if (qty) {
        return res.status(400).json({ error: 'actor mode cannot include "qty"' });
      }
    }

    if (asset_mode === 'unique') {
      if (!to || qty !== 1) {
        return res.status(400).json({ error: 'unique mode requires qty = 1 and valid "to"' });
      }
    }

    if (asset_mode === 'commodity') {
      if (!to || qty == null || qty < 0) {
        return res.status(400).json({ error: 'commodity mode requires qty > 0 and valid "to"' });
      }
    }

    if (asset_mode !== 'actor' && qty === 0) {
        const existing = await findFromGateway('states', {
            entityType: 'asset',
            entityId: asset_id
        });

        if (existing?.length) {
            return res.status(400).json({ error: 'Mint qty = 0 only allowed when creating new asset' });
        }
    }

    // Validasi to jika ada
    if (to) {
      const toParsed = parseId(to);
      if (!toParsed || !['user', 'account'].includes(toParsed.type)) {
        return res.status(400).json({ error: 'Invalid "to" format. Expected user: or account:' });
      }
    }

    // Kirim event
    const result = await sendEvent({
      type: 'asset.mint',
      data: {
        asset_id,
        schemaId,
        type,
        asset_mode,
        qty,
        to,
        metadata
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
    const { asset_id, qty } = req.body;
    const actor = req.user.id;

    if (!asset_id) return res.status(400).json({ error: 'Missing asset_id' });

    const stateRes = await findFromGateway('states', {
      entityType: 'asset',
      entityId: asset_id
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

    const result = await sendEvent({
      type: 'asset.burn',
      data: { asset_id, qty: qty || 1 },
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
    const { asset_id, to, qty } = req.body;
    const actor = req.user.id;

    if (!asset_id || !to) return res.status(400).json({ error: 'Missing asset_id or to' });

    const toParsed = parseId(to);
    if (!toParsed || !['user', 'account'].includes(toParsed.type)) {
      return res.status(400).json({ error: 'Invalid "to" ID format' });
    }

    const stateRes = await findFromGateway('states', {
      entityType: 'asset',
      entityId: asset_id
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

    const result = await sendEvent({
      type: 'asset.transfer',
      data: { asset_id, from: actor, to, qty: qty || 1 },
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
          asset_id: state.entityId,
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
      asset_id: id,
      metadata: asset.metadata || {},
      holders: asset.holders || {}
    });
  } catch (err) {
    console.error('Get asset metadata failed:', err.message);
    res.status(500).json({ error: 'Failed to get asset metadata' });
  }
};