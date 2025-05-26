const mode = process.argv[2] || 'api';

switch (mode) {
  case 'api':
    require('./api/app')();
    break;
  
  case 'consensus':
    require('./consensus/engine')();
    break;
  case 'worker':
    require('./worker/worker');
    break;
  case 'gateway':
    console.log('🛰️ Starting mongo-gateway...');
    const app = require('./mongo-gateway/index'); // kamu perlu pastikan file ini ada
    const PORT = process.env.MONGO_GATEWAY_PORT || 3002;
    app.listen(PORT, () => {
      console.log(`🛰️ Mongo Gateway running on port ${PORT}`);
    });
    break;
  default:
    console.log(`
      Usage:
        node server api       → Start API server
        node server worker    → Start worker (gateway + replay)
        node server gateway   → Start only gateway on port ${process.env.MONGO_GATEWAY_PORT || 3002}
      `);
    process.exit(1);
}