const fs = require('fs');
const path = require('path');
const { NODE_ID, STAKE } = require('../utils/config');
const gossip = require('../gossip/gossipEngine');

const cacheFolder = path.join(__dirname, '../cache');
if (!fs.existsSync(cacheFolder)) {
    fs.mkdirSync(cacheFolder);
}
const ledgerFile = path.join(cacheFolder, `block_${NODE_ID}.json`);
const voteThreshold = 2 / 3;
const MAX_PAST_MS = 10000;    // max 10 detik mundur
const MAX_FUTURE_MS = 1000;   // max 1 detik ke depan

let blockPool = {}; // { slot: { block, votes: Set<nodeId>, finalized: bool } }
let finalizedBlocks = [];

// Load ledger from file if exists
if (fs.existsSync(ledgerFile)) {
    finalizedBlocks = JSON.parse(fs.readFileSync(ledgerFile, 'utf-8'));
}

function getFinalizedLedger() {
    return finalizedBlocks;
}

function proposeBlock() {
    const slot = Date.now();
    console.log(`📤 Proposing block at slot ${slot} by ${NODE_ID}`);
    const block = {
        slot,
        leader: NODE_ID,
        data: { tx: `tx_from_${NODE_ID}_at_slot_${slot}` }, // contoh tx
        timestamp: Date.now()
    };

    console.log(`📤 Proposing block at slot ${slot} by ${NODE_ID}`);
    broadcastBlock(block);
    storeBlock(block);
    voteBlock(block.slot, NODE_ID); // leader auto-vote dirinya
}

function broadcastBlock(block) {
    const msg = JSON.stringify({ type: 'block', block });
    console.log(`📡 Broadcasting block slot ${block.slot} to all peers`);
    gossip.broadcastToAll(msg);
}

function storeBlock(block) {
    if (!blockPool[block.slot]) {
        blockPool[block.slot] = { block, votes: new Set(), finalized: false };
    }
}

function voteBlock(slot, voter) {
    if (!blockPool[slot]) return;
    blockPool[slot].votes.add(voter);
    console.log(`🗳️ Node ${voter} voted for slot ${slot}`);
    checkFinalization(slot);
}

function checkFinalization(slot) {
    const entry = blockPool[slot];
    if (!entry || entry.finalized) return;

    const activeNodes = gossip.getActiveNodeList();
    const total = activeNodes.length;
    const votes = entry.votes.size;

    console.log(`🔎 Finalization check for slot ${slot}: votes=${votes}, total=${total}, threshold=${voteThreshold}`);

    if (votes / total >= voteThreshold) {
        entry.finalized = true;
        finalizedBlocks.push(entry.block);
        fs.writeFileSync(ledgerFile, JSON.stringify(finalizedBlocks, null, 2));
        console.log(`✅ Block slot ${slot} finalized with ${votes}/${total} votes`);
        console.log(`💾 Block saved to: ${ledgerFile}`);
    }
}

function handleMessage(msg) {
    try {
        const data = JSON.parse(msg);

        if (data.type === 'block') {
            const { block } = data;
            const now = Date.now();
            const delta = now - block.timestamp;

            console.log(`📩 Received block for slot ${block.slot} from ${block.leader}`);

            if (block.timestamp > now) {
                console.warn(`❌ Reject block ${block.slot} from ${block.leader}: timestamp from future`);
                return;
            }

            if (delta > MAX_PAST_MS) {
                console.warn(`❌ Reject block ${block.slot} from ${block.leader}: too old (${delta} ms)`);
                return;
            }

            storeBlock(block);
            voteBlock(block.slot, NODE_ID);
        }
    } catch (e) {
        console.warn("⚠️ Block message error:", e.message);
    }
}

module.exports = {
    proposeBlock,
    handleMessage,
    getFinalizedLedger
};