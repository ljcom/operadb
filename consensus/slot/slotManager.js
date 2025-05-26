// slot/slotManager.js
const { getLeaderForSlot } = require('../leader/leaderScheduler');
const { NODE_ID } = require('../utils/config');
const { proposeBlock } = require('../block/blockEngine');

let currentSlot = 0;

function startSlotLoop() {
    setInterval(() => {
        const leader = getLeaderForSlot(currentSlot);
        const isLeader = leader === NODE_ID;
        console.log(`📦 Slot ${currentSlot} | Leader: ${leader} ${isLeader ? "(YOU)" : ""}`);
        console.log(`DEBUG → NODE_ID: ${NODE_ID}, Leader: ${leader}, currentSlot: ${currentSlot}`);
        
        if (isLeader) {
            // Simulasi produksi blok
            console.log(`✅ Node ${NODE_ID} producing block for slot ${currentSlot}`);
            proposeBlock(); 
        }

        currentSlot++;
    }, 1000); // 1 slot = 1 detik
}

module.exports = startSlotLoop;