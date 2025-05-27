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

async function saveSnapshot({ entityType, refId, account, state, lastTimestamp, schemaVersion }) {
  try {
    await axios.post(`${GATEWAY}/update`, {
      collection: 'snapshots',
      filter: { entityType, refId, account },
      updateDoc: {
        $set: {
          state,
          lastTimestamp,
          schemaVersion,
          updatedAt: new Date()
        }
      },
      upsert: true
    }, {
      headers: {
        Authorization: `Bearer ${SECRET}`
      }
    });

    console.log(`✅ Snapshot saved: ${entityType} → ${refId}`);
  } catch (err) {
    console.error(`❌ Failed to save snapshot for ${entityType}:${refId}`, err.response?.data || err.message);
  }
}

async function loadSnapshot({ entityType, refId, account }) {
  try {
    const res = await axios.post(`${GATEWAY}/findOne`, {
      collection: 'snapshots',
      query: { entityType, refId, account }
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });

    if (!res.data) {
      return null; // snapshot not found
    }
    return res.data;
    
  } catch (err) {
    console.error('❌ Failed to load snapshot from gateway:', err.message);
    return null;
  }
}

exports.handleEventReplay = async (event, db) => {
  const { type, data, account } = event;
  const [entityType] = type.split('.');

  const reducer = reducers[entityType];
  if (!reducer || typeof reducer.replay !== 'function') {
    console.warn(`⚠️ No reducer registered for ${entityType}, skipping...`);
    return;
  }
  if (!reducer || !reducer.replay) return;

  const refFieldMap = {
    account: 'accountId',
    user: 'username',
    schema: 'schemaId',
    coin: 'coinId',
    asset: 'asset_id',
    contract: 'contract_id',
    data: 'data_id',
    role: 'roleId'
  };

  const refField = refFieldMap[entityType] || 'refId';
  const refId = data[refField] || data.refId || event._id;

  console.log(`▶️ handleEventReplay: ${entityType} → ${refId}`);

  // 1. Load snapshot
  const snapshot = await loadSnapshot({ entityType, refId, account });
  const lastTimestamp = snapshot?.lastTimestamp;

  // 2. Fetch relevant events (only those after lastTimestamp)
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

  const relatedEvents = relatedEventsRes.data;
  if (!relatedEvents.length) {
    console.log('🟡 No new events for:', refId);
    return;
  }

  // 3. Replay (optionally with base state)
  const baseState = snapshot?.state || {};
  let state = reducer.replay(relatedEvents, baseState);
  const slot = typeof snapshot?.slot === 'number' ? snapshot.slot : 0;


  // ⛔ Jangan teruskan jika state tidak valid
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    console.warn(`⚠️ Invalid state returned for ${entityType}:${refId}, skipping update.`);
    return;
  }
  const latestTimestamp = relatedEvents.at(-1).timestamp;

  // 4. Save state to states + snapshot
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
        }
      }
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });
  } catch (err) {
    console.error('❌ Failed to update state:', err.message, err.response?.data);
  }

  // 5. Save snapshot
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
