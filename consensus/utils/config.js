// utils/config.js
const NODE_ID = process.env.NODE_ID || "node1";
const NODE_PORT = parseInt(process.env.NODE_PORT || "3000", 10);
const PEER_WS = (process.env.PEER_WS || "").split(',').filter(x => x);
const BOOTSTRAP_NODES = (process.env.BOOTSTRAP_NODES || "").split(',').filter(x => x);

const STAKE_WEIGHT = {
  node1: 10,
  node2: 20,
  node3: 30,
  node4: 40
};

module.exports = {
  NODE_ID,
  NODE_PORT,
  STAKE: STAKE_WEIGHT[NODE_ID] || 0,
  PEER_WS,
  BOOTSTRAP_NODES
};