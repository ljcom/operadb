// leader/leaderScheduler.js
const gossip = require('../gossip/gossipEngine');

const slotPerEpoch = 20; // 50 slot per epoch
let leaderCache = {}; // Cache hasil jadwal leader per epoch

/**
 * Membuat jadwal leader untuk epoch tertentu berdasarkan daftar node aktif dari gossip
 */
function generateScheduleForEpoch(epoch) {
    const schedule = [];
    const nodeList = gossip.getActiveNodeList();

    console.log(`🧠 Active node list:`, nodeList.map(n => n.id));
    
    if (nodeList.length < 2) {
        console.warn(`⚠️ Epoch ${epoch}: not enough active nodes for leader rotation (${nodeList.length} node)`);
        return;
    }

    // Total stake semua node aktif
    const totalStake = nodeList.reduce((sum, node) => sum + (node.stake || 0), 0);

    // Distribusi slot per node
    let slotsRemaining = slotPerEpoch;
    for (const node of nodeList) {
        const share = Math.floor((node.stake / totalStake) * slotPerEpoch);
        for (let i = 0; i < share; i++) {
            schedule.push(node.id);
            slotsRemaining--;
        }
    }

    // Kalau ada slot sisa (karena pembulatan), isi round-robin
    while (slotsRemaining > 0) {
        for (const node of nodeList) {
            schedule.push(node.id);
            slotsRemaining--;
            if (slotsRemaining <= 0) break;
        }
    }

    leaderCache[epoch] = schedule;
    console.log(`🗓️ Leader schedule generated for epoch ${epoch} with ${nodeList.length} active nodes.`);
}

/**
 * Mengambil leader untuk slot tertentu
 */
function getLeaderForSlot(slot) {
    const epoch = Math.floor(slot / slotPerEpoch);
    const offset = slot % slotPerEpoch;

    if (!leaderCache[epoch]) {
        generateScheduleForEpoch(epoch);
    }

    return leaderCache[epoch]?.[offset];
}

/**
 * Inisialisasi awal
 */
async function loadLeaderSchedule() {
    console.log("📋 Dynamic leader scheduler (via gossip) loaded.");
}

module.exports = {
    loadLeaderSchedule,
    getLeaderForSlot
};