const { sendEvent } = require('../utils/eventSender');

exports.createSchema = async (req, res) => {
  try {
    const { schemaId, description, fields, reducerCode, version } = req.body;
    const accountId = req.accountId;
    const actor = req.user.id;

    if (!schemaId || !reducerCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await sendEvent({
      type: 'schema.create',
      data: { schemaId, description, fields, reducerCode, version },
      account: accountId,
      actor
    });

    res.status(201).json({ message: 'Schema creation event submitted', event: result.data });
  } catch (err) {
    console.error('Failed to create schema:', err.message);
    res.status(500).json({ error: 'Failed to create schema' });
  }
};