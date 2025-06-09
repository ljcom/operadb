const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { isValidAddressFormat, generateScopedId } = require('../utils/idNaming');

exports.issueData = async (req, res) => {
  try {
    const actor = req.address;
    const accountId = req.accountId;
    const { assetId, to } = req.body;

    if (!assetId || !to) {
      return res.status(400).json({ error: 'Missing assetId or to' });
    }

    // Ambil asset dari gateway
    // 1) Ambil asset dari gateway
    const assets = await findFromGateway('states', {
      entityType: 'asset',
      refId: assetId,
      account: accountId
    });
    const asset = assets?.[0];

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // 2) Ambil schema untuk asset ini
    const schemaId1 = await generateScopedId('mod', accountId.split(':')[1], 'schema', asset.refId.split(':')[2]);
    const schemaList = await findFromGateway('states', {
      entityType: 'schema',
      refId: schemaId1,
      account: accountId
    });
    const schema = schemaList?.[0];
    if (!schema) {
      return res.status(500).json({ error: 'Schema not found for this asset' });
    }

    // 3) Periksa entityType di schema
    if (schema.state[schemaId1].entityType !== 'asset.unique') {
      return res.status(400).json({ error: 'Only unique-type assets can be issued as data' });
    }

    // Cek apakah sudah pernah di-issue
    const dataId = 'data:' + assetId.replace(/^obj:/, '') + ':' + to;
    const existing = await findFromGateway('states', {
      entityType: 'data',
      refId: dataId
    });
    if (existing?.length) {
      return res.status(409).json({ error: 'Data already issued to this address' });
    }
    if (to && !isValidAddressFormat(to)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    // Kirim event data.issue
    const result = await sendEvent({
      type: 'data.issue',
      data: {
        dataId,
        schemaId: asset.schemaId,
        type: asset.type,
        source_asset: asset.assetId,
        owner: to,
        content: asset.metadata
      },
      actor,
      account: accountId
    });

    res.status(201).json({ message: 'Data issued', event: result.data });

  } catch (err) {
    console.error('Issue data failed:', err.message);
    res.status(500).json({ error: 'Failed to issue data' });
  }
};

exports.getDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await findFromGateway('states', {
      entityType: 'data',
      entityId: id
    });

    if (!result?.length) return res.status(404).json({ error: 'Data not found' });
    res.status(200).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Get data failed' });
  }
};

exports.getOwnedData = async (req, res) => {
  try {
    const { address } = req.params;
    const result = await findFromGateway('states', { entityType: 'data' });

    const owned = result.filter(d => d.owner === address && d.visibility !== 'private');
    res.status(200).json(owned);
  } catch (err) {
    res.status(500).json({ error: 'Get owned data failed' });
  }
};

exports.revokeData = async (req, res) => {
  try {
    const actor = req.address;
    const accountId = req.accountId;
    const { dataId, reason } = req.body;

    if (!dataId || !reason) {
      return res.status(400).json({ error: 'dataId and reason are required' });
    }

    // Pastikan dataId valid dan milik account ini
    const dataRes = await findFromGateway('states', {
      entityType: 'data',
      entityId: dataId,
      account: accountId
    });

    const dataState = dataRes?.[0];
    if (!dataState) {
      return res.status(404).json({ error: 'Data not found or not owned by account' });
    }

    if (dataState.revoked) {
      return res.status(400).json({ error: 'Data already revoked' });
    }

    const result = await sendEvent({
      type: 'data.revoke',
      data: {
        dataId,
        reason
      },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Data revoked', event: result.data });

  } catch (err) {
    console.error('Revoke data failed:', err.message);
    res.status(500).json({ error: 'Failed to revoke data' });
  }
};