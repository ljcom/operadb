// 5testCreateActor.js

require('dotenv').config();
const axios = require('axios');
const { ethers } = require('ethers');

const API_URL = process.env.API_URL;      // e.g. http://localhost:3000
const ACCOUNT_ID = process.env.ACCOUNT_ID;   // account yang akan dipakai
const PRIVATE_KEY = process.env.USER1_PRIVATE_KEY;  // private key pemilik account

// Inisialisasi wallet dari private key
const wallet = new ethers.Wallet(PRIVATE_KEY);

async function signMe() {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `accounts.me:${timestamp}`;
  const signature = await wallet.signMessage(message);
  return { timestamp, signature };
}

/**
 * Buat satu actor
 */
async function createActor(actor) {
  const { timestamp, signature } = await signMe();

  const headers = {
    'Content-Type': 'application/json',
    'x-timestamp': timestamp,
    'x-signature': signature
  };

  // Endpoint register actor; accountResolver akan pakai query param `account`
  const url = `${API_URL}/actors/register?account=${ACCOUNT_ID}`;

  const payload = {
    schemaId: actor.schemaId,
    actorId: actor.actorId,
    name: actor.name,
    address: actor.address,
    label: actor.label,
    note: actor.note,
    status: actor.status,
    actorType: actor.actorType || 'user'  // Default ke 'user' jika tidak ada
  };

  try {
    const res = await axios.post(url, payload, { headers });
    console.log(`✅ Created actor ${actor.actorId}:`, res.data);
  } catch (err) {
    console.error(
      `❌ Failed to create ${actor.actorId}:`,
      err.response?.data || err.message
    );
  }
}

//
// Contoh data 5 actor yang ingin dibuat.
// Pastikan `actorId` bersifat unik (tidak sama dengan existing di DB).
//
const actors = [
  {
    schemaId: 'employee',
    actorId: 'emp01',
    name: 'Alice Johnson',
    address: '0xAaAa000000000000000000000000000000001111',
    label: 'Engineer',
    note: 'Test actor 1',
    status: 'active',
    actorType: 'user'
  },
  {
    schemaId: 'employee',
    actorId: 'emp02',
    name: 'Bob Smith',
    address: '0xBbBb000000000000000000000000000000002222',
    label: 'Manager',
    note: 'Test actor 2',
    status: 'active',
    actorType: 'user'
  },
  {
    schemaId: 'employee',
    actorId: ' emp03',
    name: 'Carol Lee',
    address: '0xCcCc000000000000000000000000000000003333',
    label: 'Designer',
    note: 'Test actor 3',
    status: 'active',
    actorType: 'user'
  },
  {
    schemaId: 'employee',
    actorId: ' emp04',
    name: 'David Kim',
    address: '0xDdDd000000000000000000000000000000004444',
    label: 'Analyst',
    note: 'Test actor 4',
    status: 'active',
  },
  {
    schemaId: 'employee',
    actorId: ' emp05',
    name: 'Eva Green',
    address: '0xEeEe000000000000000000000000000000005555',
    label: 'Intern',
    note: 'Test actor 5',
    status: 'active',
    actorType: 'user'
  },
];

(async () => {
  for (const actor of actors) {
    await createActor(actor);
  }
})();