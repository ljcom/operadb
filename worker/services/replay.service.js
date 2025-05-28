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

  // 1. Load existing state from 'states' collection
  let baseState = {};
  let lastTimestamp = null;
  let slot = 0;

  try {
    const res = await axios.post(`${GATEWAY}/findOne`, {
      collection: 'states',
      query: { entityType, refId, account }
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });

    if (res.data) {
      baseState = res.data.state || {};
      lastTimestamp = res.data.lastTimestamp || null;
      slot = typeof res.data.slot === 'number' ? res.data.slot : 0;
    }
  } catch (err) {
    console.error('❌ Failed to load state from gateway:', err.message);
  }

  // 💡 Skip replay if event already covered
  if (lastTimestamp && timestamp <= lastTimestamp) {
    console.log(`⏩ Event ${event._id} dilewati karena timestamp (${timestamp}) <= lastTimestamp (${lastTimestamp})`);
    return;
  }

  // 2. Fetch events newer than lastTimestamp
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

  if (relatedEvents.length === 0) {
    console.log(`⚠️ Tidak ada event baru untuk ${entityType}:${refId}`);
    return;
  }

  // 3. Replay
  const newState = reducer.replay(relatedEvents, baseState);
  if (!newState || typeof newState !== 'object' || Array.isArray(newState)) {
    console.warn(`⚠️ Invalid state returned for ${entityType}:${refId}, skipping update.`);
    return;
  }

  const latestTimestamp = relatedEvents.at(-1)?.timestamp || timestamp;

  // 4. Save updated state to 'states'
  try {
    await axios.post(`${GATEWAY}/update`, {
      collection: 'states',
      filter: { entityType, refId, account },
      updateDoc: {
        $set: {
          state: newState,
          slot,
          refId,
          entityType,
          account,
          lastTimestamp: latestTimestamp,
          updatedAt: new Date()
        }
      },
      upsert: true
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });
    console.log(`✅ State saved: ${entityType} → ${refId}`);
  } catch (err) {
    console.error('❌ Failed to update state:', err.message, err.response?.data);
  }
};