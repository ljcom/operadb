const axios = require('axios');

const GATEWAY = process.env.MONGO_GATEWAY_URL;
const SECRET = process.env.GATEWAY_SECRET;

exports.findFromGateway = async (collection, query = {}, sort = {}) => {
  const response = await axios.post(`${GATEWAY}/find`, {
    collection,
    query,
    sort
  }, {
    headers: {
      Authorization: `Bearer ${SECRET}`
    }
  });

  return response.data;
};