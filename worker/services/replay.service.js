const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const axios = require('axios');
const GATEWAY = process.env.MONGO_GATEWAY_URL;
const SECRET = process.env.GATEWAY_SECRET;

const reducers = {
  product: require('../reducers/product'),
  account: require('../reducers/account'),
  user: require('../reducers/user'),
  schema: require('../reducers/schema')
};

exports.handleEventReplay = async (event) => {
  const { type, data, account, _id } = event;
  const [entityType] = type.split('.');

  console.log('▶️ handleEventReplay called with:', type, '→ entityType:', entityType);

  const reducer = reducers[entityType];
  if (!reducer || !reducer.replay) return;

  const refId = data.refId || event._id;
  console.log('🔎 Using refId:', refId);

  const relatedEventsRes = await axios.post(`${GATEWAY}/find`, {
    collection: 'events',
    query: {
      'data.product_id': refId,
      type: { $regex: `^${entityType}\\.` },
      account
    },
    sort: { timestamp: 1 }
  }, {
    headers: {
      Authorization: `Bearer ${SECRET}`
    }
  });

  const relatedEvents = relatedEventsRes.data;
  const state = reducer.replay(relatedEvents);

  await axios.post(`${GATEWAY}/update`, {
    collection: 'states',
    filter: {
      entityType,
      refId,
      account
    },
    updateDoc: {
      $set: {
        state,
        lastEventId: _id,
        updatedAt: new Date()
      }
    },
    options: {
      upsert: true
    }
  }, {
    headers: {
      Authorization: `Bearer ${SECRET}`
    }
  });

  console.log(`✅ State saved: ${entityType} → ${refId}`);
};