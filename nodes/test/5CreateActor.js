// 5testCreateActor.js

require('dotenv').config();
const axios = require('axios');

const endpoint  = process.env.API_URL;        // misal: "http://localhost:3000"
const token     = process.env.USER1_TOKEN;    // token valid untuk user yang bisa create actor
const accountId = process.env.ACCOUNT_ID;     // account yang dipakai untuk membuat actor

if (!endpoint || !token || !accountId) {
  console.error('❌ Pastikan variabel .env: API_URL, USER1_TOKEN, ACCOUNT_ID sudah di-set');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

//
// Contoh data 5 actor yang ingin dibuat.
// Pastikan `actorId` bersifat unik (tidak sama dengan existing di DB).
//
const actors = [
  {
    actorId: 'act:omlxbx54:emp01',
    name: 'Alice Johnson',
    address: '0xAaAa000000000000000000000000000000001111',
    label: 'Engineer',
    note: 'Test actor 1',
    status: 'active',
  },
  {
    actorId: 'act:omlxbx54:emp02',
    name: 'Bob Smith',
    address: '0xBbBb000000000000000000000000000000002222',
    label: 'Manager',
    note: 'Test actor 2',
    status: 'active',
  },
  {
    actorId: 'act:omlxbx54:emp03',
    name: 'Carol Lee',
    address: '0xCcCc000000000000000000000000000000003333',
    label: 'Designer',
    note: 'Test actor 3',
    status: 'active',
  },
  {
    actorId: 'act:omlxbx54:emp04',
    name: 'David Kim',
    address: '0xDdDd000000000000000000000000000000004444',
    label: 'Analyst',
    note: 'Test actor 4',
    status: 'active',
  },
  {
    actorId: 'act:omlxbx54:emp05',
    name: 'Eva Green',
    address: '0xEeEe000000000000000000000000000000005555',
    label: 'Intern',
    note: 'Test actor 5',
    status: 'active',
  },
];

(async () => {
  for (const actor of actors) {
    try {
      // Sesuaikan payload sesuai yang diharapkan backend:
      const payload = {
        actorId: actor.actorId,
        name:    actor.name,
        address: actor.address,
        label:   actor.label,
        note:    actor.note,
        status:  actor.status,
      };

      // Jika backend memerlukan query param account=<ACCOUNT_ID> saat create:
      const url = `${endpoint}/actors?account=${accountId}`;

      const res = await axios.post(url, payload, { headers });
      console.log(`✅ Created actor: ${actor.actorId}`, res.data);
    } catch (err) {
      // Tampilkan pesan error jika gagal (misalnya 400, 401, 409, dll)
      console.error(
        `❌ Failed to create actor: ${actor.actorId}`,
        err.response?.data || err.message
      );
    }
  }
})();