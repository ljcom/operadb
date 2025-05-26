const { sendEvent } = require('../utils/eventSender');
const { generateId } = require('../utils/idNaming');

exports.createContractSchema = async (req, res) => {
  try {
    const { description, fields, reducerCode, version } = req.body;
    const accountId = req.accountId;
    const actor = req.user.id;

    if (!description || !fields || !reducerCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const contractId = generateId('contract', { description, fields, reducerCode, version });

    const result = await sendEvent({
      type: 'schema.create',
      data: { contractId, description, fields, reducerCode, version },
      account: accountId || 'system',
      actor
    });

    res.status(201).json({ message: 'Schema creation event submitted', schemaId, event: result.data });
  } catch (err) {
    console.error('Failed to create contract schema:', err.message);
    res.status(500).json({ error: 'Failed to create schema' });
  }
};