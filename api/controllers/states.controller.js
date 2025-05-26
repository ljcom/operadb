const { findFromGateway } = require('../utils/gatewayQuery');

exports.getStateByRefId = async (req, res) => {
  const { entity, refId } = req.params;
  try {
    const data = await findFromGateway('states', {
      entityType: entity,
      refId: refId
    });

    const state = data[0];
    if (!state) return res.status(404).json({ error: 'State not found' });
    res.json(state);
  } catch (err) {
    console.error('Failed to fetch state by refId:', err.message);
    res.status(500).json({ error: 'Failed to fetch state' });
  }
};