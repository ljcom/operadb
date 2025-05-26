const axios = require('axios');

const GATEWAY = process.env.MONGO_GATEWAY_URL;
const CONSENSUS = process.env.CONSENSUS_URL;
const SECRET = process.env.GATEWAY_SECRET;
const MODE = process.env.EVENT_PROCESS_MODE || 'consensus';

/**
 * Mengirim event dengan mode 'consensus' atau 'direct'
 * @param {string} type - jenis event, misal 'product.receive'
 * @param {object} data - payload event
 * @param {string} account - ID akun
 * @param {string} actor - ID pengguna
 */

exports.sendEvent = async ({ type, data, account, actor }) => {
  const baseEvent = {
    type,
    data,
    account,
    actor,
    createdAt: new Date()
  };
  console.log(`MODE: ${MODE}`);
  if (MODE === 'consensus') {
    try {
      const result = await axios.post(`${CONSENSUS}/verify`, {
        type,
        data,
        account,
        actor
      }, {
        headers: { Authorization: `Bearer ${SECRET}` }
      });

      if (!result.data?.valid) {
        throw new Error('Event rejected by consensus');
      }

      const insertResult = await axios.post(`${GATEWAY}/insert`, {
        collection: 'events',
        doc: result.data.event
      }, {
        headers: { Authorization: `Bearer ${SECRET}` }
      });
      console.log('📥 insertResult.data:', insertResult.data);

      return {
        data: {
          _id: insertResult.data.insertedId,
          ...result.data.event
        }
      };

    } catch (err) {
      console.error('❌ Consensus Error:', err.message);
      throw new Error('Consensus validation failed');
    }

  } else {
    // DIRECT mode
    const insertResult = await axios.post(`${GATEWAY}/insert`, {
      collection: 'events',
      doc: baseEvent
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });
    console.log('📥 insertResult.data:', insertResult.data);

    return {
      data: {
        _id: insertResult.data.insertedId,
        ...baseEvent
      }
    };
  }
};