const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const axios = require('axios');
const GATEWAY = process.env.MONGO_GATEWAY_URL;
const SECRET = process.env.GATEWAY_SECRET;

const reducers = {
  account: require('../reducers/account'),
  user: require('../reducers/user'),
  schema: require('../reducers/schema'),
  coin: require('../reducers/coin'),
  asset: require('../reducers/asset'),
  contract: require('../reducers/contract'),
  data: require('../reducers/data'),
  role: require('../reducers/role')
};

exports.handleEventReplay = async (event, db) => {
  const { type, data, account, timestamp } = event;
  const [entityType] = type.split('.');

  const reducer = reducers[entityType];
  if (!reducer || typeof reducer.replay !== 'function') {
    console.warn(`⚠️ No reducer registered for ${entityType}, skipping...`);
    return;
  }

  const refFieldMap = {
    account: 'accountId',
    user: 'userId',
    schema: 'schemaId',
    coin: 'coinId',
    asset: 'assetId',
    contract: 'contractId',
    data: 'dataId',
    role: 'roleId'
  };

  const refField = refFieldMap[entityType] || 'refId';
  const refId = data[refField] || data.refId || event._id;

  console.log(`▶️ handleEventReplay: ${entityType} → ${refId}`);

  // 1. Load snapshot
  const snapshot = await loadSnapshot({ entityType, refId, account });
  const lastTimestamp = snapshot?.lastTimestamp;

  // 💡 Lewati jika event timestamp tidak lebih baru
  if (lastTimestamp && timestamp <= lastTimestamp) {
    console.log(`⏩ Event ${event._id} dilewati karena timestamp (${timestamp}) <= snapshot (${lastTimestamp})`);
    return;
  }

  // 2. Ambil semua event terkait (lebih baru dari snapshot)
  const eventQuery = {
    [`data.${refField}`]: refId,
    type: { $regex: `^${entityType}\\.` },
    account
  };

  if (lastTimestamp) {
    eventQuery.timestamp = { $gt: lastTimestamp };
  }

  const relatedEventsRes = await axios.post(`${GATEWAY}/find`, {
    collection: 'events',
    query: eventQuery,
    sort: { timestamp: 1 }
  }, {
    headers: { Authorization: `Bearer ${SECRET}` }
  });

  const events = relatedEventsRes.data || [];
  const relatedEvents = events.filter(e => {
    const refVal = e.data?.[refField] || e.data?.refId || e.refId;
    return e.type.startsWith(entityType) && refVal === refId;
  });

  // 3. Replay (gunakan base state dari snapshot)
  const baseState = snapshot?.state || {};
  let state = reducer.replay(relatedEvents, baseState);
  const slot = typeof snapshot?.slot === 'number' ? snapshot.slot : 0;

  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    console.warn(`⚠️ Invalid state returned for ${entityType}:${refId}, skipping update.`);
    return;
  }

  const latestTimestamp = relatedEvents.at(-1)?.timestamp || timestamp;

  // 4. Simpan state baru
  try {
    await axios.post(`${GATEWAY}/update`, {
      collection: 'states',
      filter: { entityType, refId, account },
      updateDoc: {
        $set: {
          state,
          slot,
          refId,
          entityType,
          account,
          updatedAt: new Date()
        },
      },
      upsert: true
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });
    console.log('✅ State update sent to gateway');
  } catch (err) {
    console.error('❌ Failed to update state:', err.message, err.response?.data);
  }

  // 5. Simpan snapshot baru
  await saveSnapshot({
    entityType,
    refId,
    account,
    state,
    lastTimestamp: latestTimestamp,
    schemaVersion: state.schemaVersion || 1
  });

  console.log(`✅ State + snapshot saved: ${entityType} → ${refId}`);
};
