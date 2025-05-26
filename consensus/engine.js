const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { NODE_ID, NODE_PORT, STAKE } = require('./utils/config');
const { initGossip } = require('./gossip/gossipEngine');
const startTickGenerator = require('./tick/tickGenerator');
const { loadLeaderSchedule } = require('./leader/leaderScheduler');
const startSlotLoop = require('./slot/slotManager');


async function main() {
    console.log(`🟢 Node ${NODE_ID} starting on port ${NODE_PORT} with stake ${STAKE}`);
    await initGossip();
    startTickGenerator();
    await loadLeaderSchedule();

    setTimeout(() => {
        startSlotLoop();
    }, 5000); 
}

module.exports = function () {
    main().catch(err => {
        console.error("❌ Fatal Error:", err);
    });
};