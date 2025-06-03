const path = require('path'); // ⬅️ Tambahkan ini
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');    
if (!process.env.JWT_SECRET) {
  throw new Error('❌ Missing JWT_SECRET in .env');
}
const MODE=process.env.EVENT_PROCESS_MODE;

console.log(`📤 Sending event via: ${MODE}`);

module.exports = function () {
  const app = express();
  app.use(cors());
  // Middleware global
  app.use(express.json());

  //middleware imports
  const authMiddleware = require('./middlewares/auth');
  //const accountResolver = require('./middlewares/accountResolver');

  // Route imports
  const eventRoutes = require('./routes/events.route');
  const accountRoutes = require('./routes/accounts.route');
  const userRoutes = require('./routes/users.route');
  const schemaRoutes = require('./routes/schemas.route');
  const groupRoutes = require('./routes/groups.route');
  const authRoutes = require('./routes/auth.route');
  const stateRoutes = require('./routes/states.route');
  const coinRoutes = require('./routes/coins.route');
  const assetRoutes = require('./routes/assets.route');
  const dataRoutes = require('./routes/data.route');
  const actorRoutes = require('./routes/actors.route');
  const contractRoutes = require('./routes/contracts.route');

  console.log('authMiddleware:', typeof authMiddleware); // harus "function"
  console.log('userRoutes:', typeof userRoutes);

  // Routes
  app.use('/accounts', accountRoutes);

  app.use('/events', eventRoutes);
  app.use('/schemas', schemaRoutes);
  app.use('/groups', authMiddleware, groupRoutes);
  app.use('/users', authMiddleware, userRoutes);
  
  app.use('/coins', authMiddleware, coinRoutes);
  app.use('/assets', authMiddleware, assetRoutes);
  app.use('/data', authMiddleware, dataRoutes);
  app.use('/actors', authMiddleware, actorRoutes);
  app.use('/contracts', authMiddleware, contractRoutes);

  console.log('✅ /accounts routes registered');
  app.use('/login', authRoutes);
  app.use('/states', stateRoutes);

  // Default route
  app.get('/', (req, res) => res.send('OperaDB API is running.'));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
};