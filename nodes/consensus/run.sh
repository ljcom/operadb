# node1
NODE_ID=node1 NODE_PORT=3000 PEER_WS=ws://localhost:9001,ws://localhost:9002 node index.js

# node2
NODE_ID=node2 NODE_PORT=3001 PEER_WS=ws://localhost:9000,ws://localhost:9002 node index.js

# node3
NODE_ID=node3 NODE_PORT=3002 PEER_WS=ws://localhost:9000,ws://localhost:9001 node index.js