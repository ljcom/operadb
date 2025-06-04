const path = require('path');
const dotenv = require('dotenv');

// Load .env dari folder worker/
dotenv.config({
  path: path.resolve(__dirname, './.env')
});

const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connect() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGO_DBNAME);
  }
  return db;
}



module.exports = {
  find: async (col, query) => (await connect()).collection(col).find(query).toArray(),
  insert: async (col, doc) => (await connect()).collection(col).insertOne(doc),

  update: async (col, filter, updateDoc, options = {}) =>
    (await connect()).collection(col).updateOne(filter, updateDoc, options),

  deleteMany: async (col, filter) => (await connect()).collection(col).deleteMany(filter),
  cleanupAll: async () => {
    const db = await connect();
    const collections = await db.collections();
    for (const col of collections) {
      await col.deleteMany({});
    }
  }
};
