const crypto = require('crypto');

const prefixMap = {
  coin: 'cin-',
  asset: 'ast-',
  data: 'dtx-',
  contract: 'ctt-',
  account: 'act-',
};

function generateId(entityType, data) {
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
    .substring(0, 12);
  const prefix = prefixMap[entityType] || 'sch-';
  return prefix + hash;
}

module.exports = {
  generateId
};