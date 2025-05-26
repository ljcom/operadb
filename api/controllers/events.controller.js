const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');

exports.createEvent = async (req, res) => {
  const { type, data } = req.body;

  if (!type || !data) return res.status(400).json({ error: 'Missing type or data' });
  if (!req.accountId) return res.status(400).json({ error: 'Missing x-account-id header' });

  try {
    // ✅ Cek apakah accountId valid
    const accounts = await findFromGateway('accounts', { _id: req.accountId });
    if (accounts.length === 0) {
      return res.status(400).json({ error: 'Invalid or unknown accountId' });
    }

    const result = await sendEvent({
      type,
      data,
      account: req.accountId,
      actor: req.user.id
    });

    res.status(201).json({ message: 'Event created', event: result.data });
  } catch (err) {
    console.error('Failed to send event:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const data = await findFromGateway('events', {}, { createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error('Error fetching all events:', err.message);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// GET /events/:id
exports.getEventById = async (req, res) => {
  try {
    const data = await findFromGateway('events', { _id: req.params.id });
    const event = data[0];
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error('Error fetching event by ID:', err.message);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// GET /events/bytype/:type
exports.getEventsByType = async (req, res) => {
  try {
    const data = await findFromGateway('events', { type: req.params.type }, { createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error('Error fetching events by type:', err.message);
    res.status(500).json({ error: 'Failed to fetch events by type' });
  }
};

