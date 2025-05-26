// gossip/wsGossipEngine.js
const WebSocket = require('ws');
const { NODE_ID, NODE_PORT, STAKE } = require('../utils/config');
const { BOOTSTRAP_NODES } = require('../utils/config');
//const blockEngine = require('../block/blockEngine');

const peerSockets = {}; // key: nodeId, value: ws

const SERVER_PORT = 9000 + parseInt(NODE_PORT);
const peerNodes = {}; // { nodeId: { stake, ws, lastSeen } }
const connectedClients = new Set(); // WebSocket instances
const knownNodeIds = new Set(); // nodeIds we've seen before

function broadcastHello(ws) {
    const msg = JSON.stringify({
        type: 'hello',
        nodeId: NODE_ID,
        stake: STAKE,
        port: SERVER_PORT 
    });
    ws.send(msg);
}

function fanout(msg, excludeWs = null) {
    for (const client of connectedClients) {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    }
}

function handleMessage(msg, ws) {
    try {
        const data = JSON.parse(msg);

        if (data.type === 'hello') {
            if (data.nodeId === NODE_ID) return; // skip self

            const now = Date.now();
            const isNew = !knownNodeIds.has(data.nodeId);
            knownNodeIds.add(data.nodeId);

            if (!peerNodes[data.nodeId]) {
                peerNodes[data.nodeId] = {};
            }

            peerNodes[data.nodeId].stake = data.stake;
            peerNodes[data.nodeId].ws = ws;
            peerNodes[data.nodeId].lastSeen = now;
            peerNodes[data.nodeId].port = data.port; 

            if (isNew) {
                console.log(`📥 Hello from ${data.nodeId} (stake ${data.stake})`);
            }

            // ✅ Selalu pastikan connect-back jika belum ada koneksi WebSocket
            if (!peerSockets[data.nodeId] && data.nodeId !== NODE_ID && data.port) {
                const peerUrl = `ws://localhost:${data.port}`;
                console.log(`🔁 Connecting back to ${data.nodeId} at ${peerUrl}`);
                connectToPeer(peerUrl);
            }
        }
        if (data.type === 'block') {
            const blockEngine = require('../block/blockEngine');
            blockEngine.handleMessage(msg); 
        }
    } catch (e) {
        console.warn("⚠️ Invalid message:", e.message);
    }
}

function startServer() {
    const wss = new WebSocket.Server({ port: SERVER_PORT });

    wss.on('connection', (ws) => {
        connectedClients.add(ws);

        // Kirim hello dari diri sendiri
        broadcastHello(ws);

        // Kirim hello dari semua peer yang sudah dikenal
        for (const [peerId, info] of Object.entries(peerNodes)) {
            const msg = JSON.stringify({
                type: 'hello',
                nodeId: peerId,
                stake: info.stake,
                port: info.port || 9000  // default/fallback port
            });

            try {
                ws.send(msg);
            } catch (err) {
                console.warn(`⚠️ Failed to sync hello for ${peerId}: ${err.message}`);
            }
        }

        ws.on('message', (msg) => handleMessage(msg, ws));
        ws.on('close', () => connectedClients.delete(ws));
    });

    console.log(`🌐 WS server running on ws://localhost:${SERVER_PORT}`);

    setInterval(() => {
        for (const client of connectedClients) {
            if (client.readyState === WebSocket.OPEN) {
                broadcastHello(client);
            }
        }
    }, 5000);
}

function connectToPeer(peerUrl) {
    if (Object.values(peerSockets).some(p => p.url === peerUrl)) return;

    const ws = new WebSocket(peerUrl);
    ws.url = peerUrl;

    ws.on('open', () => {
        connectedClients.add(ws);
        broadcastHello(ws);
        console.log(`🔗 Connected to ${peerUrl}`);
    });

    ws.on('message', (msg) => {
        handleMessage(msg, ws);

        // Coba parse untuk dapat nodeId
        try {
            const data = JSON.parse(msg);
            if (data.type === 'hello' && data.nodeId && !peerSockets[data.nodeId]) {
                peerSockets[data.nodeId] = ws;
            }
        } catch (e) {
            console.warn("⚠️ Invalid message during peer connection:", e.message);
        }
    });

    ws.on('close', () => connectedClients.delete(ws));
    ws.on('error', (err) => {
        console.warn(`⚠️ Cannot connect to ${peerUrl}: ${err.message}`);
    });
}

function connectToBootstrap() {
    for (const peerUrl of BOOTSTRAP_NODES) {
        connectToPeer(peerUrl);
    }
}

async function initGossip() {
    console.log("🌐 Starting WS gossip (bootstrap mode)...");
    startServer();
    connectToBootstrap();
}

function getActiveNodeList() {
    const now = Date.now();
    const TIMEOUT = 10000; // 10 detik

    const active = Object.entries(peerNodes)
        .filter(([_, info]) => now - info.lastSeen < TIMEOUT)
        .map(([id, info]) => ({
            id,
            stake: info.stake,
            lastSeen: info.lastSeen
        }));

    // ✅ Tambahkan diri sendiri ke daftar aktif
    active.push({ id: NODE_ID, stake: STAKE, lastSeen: now });

    return active;
}

function broadcastToAll(msg) {
    for (const client of connectedClients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    }
}

module.exports = {
    initGossip,
    getActiveNodeList,
    broadcastToAll,
};