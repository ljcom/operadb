const crypto = require('crypto');
const { findFromGateway } = require('./gatewayQuery'); // pastikan sudah tersedia

const slugify = (str) => {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 20);
};

const hashTail = (str, len = 4) => {
  return crypto.createHash('md5').update(str).digest('hex').substring(0, len);
};

function isValidAddressFormat(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}


// ✅ Pemetaan prefix untuk semua entitas
const prefixMap = {
  coin: 'coin:',
  asset: 'obj:',
  data: 'did:',
  contract: 'trx:',
  account: 'org:',
  schema: 'mod:',
  user: 'user:',  
  role: 'role:',
  address: '0x'
};

// ✅ Generate ID dengan prefix + hash
function generateId(entityType, data) {
  if (!prefixMap[entityType]) {
    throw new Error(`Unknown entityType: ${entityType}`);
  }

  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
    .substring(0, 12);

  return prefixMap[entityType] + hash;
}

function isValidNamespace(ns) {
  return typeof ns === 'string' &&
         ns.length <= 16 &&
         /^[a-z0-9._-]+$/.test(ns);
}

async function generateScopedId(prefix, namespace, type, description) {
  const baseSlug = slugify(description);
  let finalSlug = baseSlug;
  let counter = 1;

  // Fungsi pembantu untuk cek apakah ID sudah ada
  async function idExists(id) {
    const result = await findFromGateway('states', {
      entityType: prefix,
      entityId: id
    });
    return result && result.length > 0;
  }

  // Coba sampai ID unik ditemukan
  while (await idExists(`${prefix}:${namespace}:${type}:${finalSlug}`)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
    if (counter > 9999) throw new Error('Too many duplicates');
  }

  return `${prefix}:${namespace}:${type}:${finalSlug}`;
}

async function validateScopedId(id) {
  if (typeof id !== 'string' || id.length > 64) return false;
  const parts = id.split(':');
  if (parts.length !== 4) return false;

  const [prefix, namespace, type, slug] = parts;
  if (!slug.match(/^[a-z0-9\-]+$/)) return false;

  const result = await findFromGateway('states', {
    entityType: prefix,
    entityId: id
  });

  return result && result.length > 0;
}

// ✅ Parse ID jadi { type, value }
function parseId(id) {
  if (typeof id !== 'string' || !id.includes(':')) return null;

  const [type, ...rest] = id.split(':');
  const value = rest.join(':'); // in case value also contains ':'

  return { type, value };
}

async function validateId(id, accountId = null) {
  const parsed = parseId(id);
  if (!parsed || !parsed.type || !parsed.value) return false;

  const { type, value } = parsed;

  // 1. Cek format Ethereum address
  if (type === 'addr') {
    return isValidAddressFormat(value);
  }

  if (type === 'coin') {
    const result = await findFromGateway('states', {
      entityType: 'coin',
      entityId: id
    });
    return result && result.length > 0;
  }

  // 2. Jika account/org → cek apakah state-nya ada
  if (type === 'org') {
    const result = await findFromGateway('states', {
      entityType: 'account',
      entityId: id
    });
    return result && result.length > 0;
  }

  // 3. Jika usr atau role, accountId harus ada
  if (!accountId) return false;

  const stateResult = await findFromGateway('states', {
    entityType: 'account',
    entityId: accountId
  });

  const state = stateResult?.[0];
  if (!state) return false;

  switch (type) {
    case 'usr':
      return state.users && Object.keys(state.users).includes(id);
    case 'role':
      return state.roles && Object.keys(state.roles).includes(id);
    case 'obj':
      return state.assets && Object.keys(state.assets).includes(id);
    case 'did':
      return state.data && Object.keys(state.data).includes(id);
    case 'trx':
      return state.contracts && Object.keys(state.contracts).includes(id);
    case 'mod':
      return state.schemas && Object.keys(state.schemas).includes(id);
    default:
      return false;
  }

  // ❌ Tipe tidak dikenal
  return false;
}

module.exports = {
  generateId,
  parseId,
  prefixMap,
  validateId,
  isValidNamespace,
  generateScopedId,
  validateScopedId,
  isValidAddressFormat
};
