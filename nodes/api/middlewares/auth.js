// middlewares/auth.js
const { ethers } = require('ethers');
const { isValidAddressFormat } = require('../utils/idNaming');

module.exports = (req, res, next) => {
  // Signature & timestamp kita terima via header
  const signature = req.headers['x-signature'];
  const tsHeader  = req.headers['x-timestamp'];
  if (!signature || !tsHeader) {
    return res.status(400).json({ error: 'Missing x-signature or x-timestamp header' });
  }

  const timestamp = parseInt(tsHeader, 10);
  if (Number.isNaN(timestamp)) {
    return res.status(400).json({ error: 'Invalid timestamp format' });
  }

  // Cegah replay attack ±5 menit
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return res.status(403).json({ error: 'Timestamp too old or too far ahead' });
  }

  // Pesan yang ditandatangani harus konsisten
  const message = `accounts.me:${timestamp}`;
  let address;
  try {
    address = ethers.verifyMessage(message, signature).toLowerCase();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Pastikan format address valid
  if (!isValidAddressFormat(address)) {
    return res.status(401).json({ error: 'Recovered address invalid' });
  }

  // Set untuk controller: req.address & (opsional) req.accountId
  req.address   = address.toLowerCase();
  
  // Jika Anda ingin inject accountId dari message, bisa parsing JSON di signature payload
  return next();
};