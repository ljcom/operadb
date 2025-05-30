require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_URL;
const USER1_ID = process.env.USER1_ID;
const USER2_ID = process.env.USER2_ID;

const USER1_EMAIL = process.env.USER1_EMAIL;
const USER1_PASSWORD = process.env.USER1_PASSWORD;

const USER2_EMAIL = process.env.USER2_EMAIL;
const USER2_PASSWORD = process.env.USER2_PASSWORD;

const ACCOUNT_ID = process.env.ACCOUNT_ID;

async function loginUser(email, password) {
  try {
    console.log(`🔐 Logging in ${email}...`);
    const res = await axios.post(`${BASE_URL}/login`, 
      { accountId: ACCOUNT_ID, username: email, password });
    console.log(`✅ ${email} login success!`);
    return res.data.token;
  } catch (err) {
    console.error(`❌ Login failed for ${email}:`, err.response?.data || err.message);
    return null;
  }
}

async function userExists(username, token) {
  try {
    console.log(`🔎 Checking if ${username} on ${ACCOUNT_ID} exists...`);
    const res = await axios.get(`${BASE_URL}/users/byname/${username}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { account: ACCOUNT_ID }
    });
    console.log(`✅ User ${username} found.`);
    return true;
  } catch (err) {
    if (err.response?.status === 404) {
      console.log(`❌ User ${username} not found.`);
      return false;
    }
    console.error('Error checking user:', err.response?.data || err.message);
    return null;
  }
}

async function createUser({ username, email, password, group }, token) {
  try {
    console.log(`🆕 Creating user ${username}...`);
    const res = await axios.post(`${BASE_URL}/users`, {
      username,
      email,
      password,
      group,
      accountId: ACCOUNT_ID
    }, {
      headers: { Authorization: `Bearer ${token}` },
      params: { account: ACCOUNT_ID }
    });
    console.log('✅ User creation event submitted:', res.data.event._id);
  } catch (err) {
    console.error('❌ Create user failed:', err.response?.data || err.message);
  }
}


(async () => {
  const user1Token = await loginUser(USER1_EMAIL, USER1_PASSWORD);
  if (!user1Token) return;

  const exists = await userExists(USER2_ID, user1Token);

  if (exists === false) {
    console.log(`User ${USER2_EMAIL} is not found.`);
    await createUser({
      username: USER2_ID,
      email: USER2_EMAIL,
      password: USER2_PASSWORD,
      group: `group:${ACCOUNT_ID}:admins`
    }, user1Token);
  }
})();