const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { validateAgainstSchema } = require('../utils/validateAgainstSchema.js'); // ⬅️ helper flatten validator
const { generateScopedId, isValidAddressFormat } = require('../utils/idNaming');

exports.createContract = async (req, res) => {
  try {
    const actor = req.user.id;
    const accountId = req.accountId;
    const {
      schema_id,
      type,
      subject,
      data,
      from,
      to,
      status,
      visibility,
      metadata
    } = req.body;

    if (!schema_id || !type || !subject || !data || !from || !to) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // validate ID format
    if (!validateId(schema_id) || !validateId(from) || !validateId(to)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // check from/to format
    const fromParsed = parseId(from);
    const toParsed = parseId(to);
    if (!['user', 'account'].includes(fromParsed.type) || !['user', 'account'].includes(toParsed.type)) {
      return res.status(400).json({ error: 'from/to must be user: or account:' });
    }

    // only allow creating from own account
    if (fromParsed.type === 'account' && from !== accountId) {
      return res.status(403).json({ error: 'Cannot create contract from another account' });
    }

    // get schema scoped to this account
    const schemaList = await findFromGateway('states', {
      entityType: 'schema',
      refId: schema_id,
      account: accountId
    });
    const schema = schemaList?.[0];
    if (!schema || schema.formatType !== 'contract') {
      return res.status(400).json({ error: 'Invalid schema or wrong formatType' });
    }

    // validate data against schema.fields
    const validation = validateAgainstSchema(data, schema.fields);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }
    if (from && !isValidAddressFormat(from)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    if (to && !isValidAddressFormat(to)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    const contractId = await generateScopedId('trx', accountId.split(':')[1], type, subject);

    const result = await sendEvent({
      type: 'contract.create',
      data: {
        contractId,
        schema_id,
        contract_type: type,
        subject,
        data,
        from,
        to,
        status: status || 'draft',
        visibility: visibility || 'private',
        metadata
      },
      actor,
      account: accountId
    });

    res.status(201).json({ message: 'Contract created', event: result.data });
  } catch (err) {
    console.error('Create contract error:', err.message);
    res.status(500).json({ error: 'Failed to create contract' });
  }
};

exports.getContractById = async (req, res) => {
  const { id } = req.params;
  const result = await findFromGateway('states', {
    entityType: 'contract',
    entityId: id
  });

  if (!result?.length) return res.status(404).json({ error: 'Contract not found' });
  res.status(200).json(result[0]);
};

exports.getContractsBySubject = async (req, res) => {
  const { address } = req.params;
  const result = await findFromGateway('states', { entityType: 'contract' });
  const filtered = result.filter(c => c.subject === address);
  res.status(200).json(filtered);
};