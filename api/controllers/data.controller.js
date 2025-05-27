const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');

exports.issueData = async (req, res) => {
  try {
    const actor = req.user.id;
    const accountId = req.accountId;
    const { asset_id, to } = req.body;

    if (!asset_id || !to) {
      return res.status(400).json({ error: 'Missing asset_id or to' });
    }

    // Ambil asset dari gateway
    const assets = await findFromGateway('states', {
      entityType: 'asset',
      entityId: asset_id
    });
    const asset = assets?.[0];

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.asset_mode !== 'actor') {
      return res.status(400).json({ error: 'Only actor-type asset can be issued as data' });
    }

    // Cek apakah sudah pernah di-issue
    const data_id = 'data:' + asset_id.replace(/^obj:/, '') + ':' + to;
    const existing = await findFromGateway('states', {
      entityType: 'data',
      entityId: data_id
    });
    if (existing?.length) {
      return res.status(409).json({ error: 'Data already issued to this address' });
    }

    // Kirim event data.issue
    const result = await sendEvent({
      type: 'data.issue',
      data: {
        data_id,
        schemaId: asset.schemaId,
        type: asset.type,
        source_asset: asset.asset_id,
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
    const actor = req.user.id;
    const accountId = req.accountId;
    const { data_id, reason } = req.body;

    if (!data_id || !reason) {
      return res.status(400).json({ error: 'data_id and reason are required' });
    }

    // Pastikan data_id valid dan milik account ini
    const dataRes = await findFromGateway('states', {
      entityType: 'data',
      entityId: data_id,
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
        data_id,
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