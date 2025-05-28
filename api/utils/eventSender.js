const axios = require('axios');

const GATEWAY = process.env.MONGO_GATEWAY_URL;
const WORKER = process.env.WORKER_URL;
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

exports.sendEvent = async ({ type, data, account, actor, replay = true, prior = [],
  abortOnPriorFailure = true, batchId }) => {

  if (!batchId) batchId = `batch:${Date.now()}:${randomUUID().slice(0, 8)}`;

  for (const pEvent of prior) {
    try {
      console.log(`📌 Processing prior event: ${pEvent.type}`);
      await exports.sendEvent({
        ...pEvent,
        account,
        actor,
        replay: false, // Replay nanti dilakukan terakhir setelah semua berhasil
        batchId,
        abortOnPriorFailure
      });
    } catch (err) {
      console.error(`❌ Prior event failed: ${pEvent.type}`, err.message);
      if (abortOnPriorFailure) {
        throw new Error(`Aborted due to failed prior event: ${pEvent.type}`);
      }
    }
  }    

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

      if (replay) {
        await axios.get(`${WORKER}/replay`, {
          //eventId: insertResult.data.insertedId
        }, {
         //headers: { Authorization: `Bearer ${SECRET}` }
        }).catch(err => {
          console.warn('⚠️ Replay failed:', err.message);
        });
      }

      return {
        data: {
          _id: insertResult.data.insertedId,
          ...result.data.event
        }, batchId
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

    if (replay) {
      await axios.get(`${WORKER}/replay`, {
        //eventId: insertResult.data.insertedId
      }, {
        //headers: { Authorization: `Bearer ${SECRET}` }
      }).catch(err => {
        console.warn('⚠️ Replay failed:', err.message);
      });
    }

    return {
      data: {
        _id: insertResult.data.insertedId,
        ...baseEvent
      }, batchId
    };
  }
};