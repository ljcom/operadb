const { sendEvent } = require('../utils/eventSender');

// 1. Mint asset
exports.mintAsset = async (req, res) => {
  try {
    const { asset_id, to, type, nft_type, qty, metadata } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    // Validasi field wajib
    if (!asset_id || !to || !type || !nft_type || qty === undefined) {
      return res.status(400).json({ error: 'Missing required fields: asset_id, to, type, nft_type, or qty' });
    }

    // Validasi kombinasi nft_type dan qty
    if (nft_type === 'unique' && qty !== 1) {
      return res.status(400).json({ error: 'Unique NFT must have qty = 1' });
    }

    if (nft_type === 'commodity' && (!qty || qty < 1)) {
      return res.status(400).json({ error: 'Commodity NFT must have qty > 0' });
    }

    // TODO: Middleware check balance for asset_id and actor
    // - Ambil state asset dari DB (GET /states/asset/:asset_id)
    // - Pastikan actor memiliki qty yang mencukupi (atau pemilik tunggal untuk unique)
    // - Kalau tidak cukup, return 400 "Insufficient asset quantity"

    const result = await sendEvent({
      type: 'asset.mint',
      data: { asset_id, to, type, nft_type, qty, metadata },
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
    const accountId = req.accountId;

    if (!asset_id) return res.status(400).json({ error: 'Missing asset_id' });

    // TODO: Middleware check balance for asset_id and actor
    // - Ambil state asset dari DB (GET /states/asset/:asset_id)
    // - Pastikan actor memiliki qty yang mencukupi (atau pemilik tunggal untuk unique)
    // - Kalau tidak cukup, return 400 "Insufficient asset quantity"

    const result = await sendEvent({
      type: 'asset.burn',
      data: { asset_id, qty }, // qty opsional, tergantung reducer
      actor,
      account: accountId
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
    const { asset_id, to } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    if (!asset_id || !to) {
      return res.status(400).json({ error: 'Missing asset_id or to' });
    }

    const result = await sendEvent({
      type: 'asset.transfer',
      data: { asset_id, from: actor, to },
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Asset transferred', event: result.data });
  } catch (err) {
    console.error('Transfer asset failed:', err.message);
    res.status(500).json({ error: 'Transfer asset failed' });
  }
};

// 4. Get balance (list of assets)
exports.getOwnedAssets = async (req, res) => {
  try {
    const address = req.params.address;
    const accountId = req.accountId;

    const result = await sendEvent({
      type: 'asset.balance',
      data: { address },
      actor: req.user.id,
      account: accountId
    });

    res.status(200).json({ address, assets: result.data.assets });
  } catch (err) {
    console.error('Get balance failed:', err.message);
    res.status(500).json({ error: 'Get balance failed' });
  }
};

// 5. Get asset metadata
exports.getAssetMetadata = async (req, res) => {
  try {
    const assetId = req.params.id;
    const accountId = req.accountId;

    const result = await sendEvent({
      type: 'asset.metadata',
      data: { asset_id: assetId },
      actor: req.user.id,
      account: accountId
    });

    res.status(200).json({ asset_id: assetId, metadata: result.data.metadata });
  } catch (err) {
    console.error('Get asset metadata failed:', err.message);
    res.status(500).json({ error: 'Get asset metadata failed' });
  }
};
