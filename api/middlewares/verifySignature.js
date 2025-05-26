// middlewares/verifySignature.js
const crypto = require('crypto');
const { ethers } = require('ethers');

module.exports = (req, res, next) => {
  const { actor, signature, timestamp } = req.body;

  if (!actor || !signature || !timestamp) {
    return res.status(400).json({ error: 'Missing actor, signature, or timestamp' });
  }

  const payloadHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ ...req.body, signature: undefined }), 'utf8')
    .digest('hex');

  try {
    const recovered = ethers.utils.verifyMessage(payloadHash, signature);
    if (recovered.toLowerCase() !== actor.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    req.user = { id: actor }; // inject actor as user.id for compatibility
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Signature verification failed' });
  }
};