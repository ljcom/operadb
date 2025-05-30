const { sendEvent } = require('../utils/eventSender');
const { generateScopedId, isValidIdFormat } = require('../utils/idNaming');
const { findFromGateway } = require('../utils/gatewayQuery');

exports.createSchema = async (req, res) => {
  try {
    const { schemaId, description, fields, reducerCode, entityType,
        version, workflow, format_type } = req.body;

    const accountId = req.accountId;
    const actor = req.user.id;

    if (!fields || !entityType || !version || !reducerCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidIdFormat(schemaId)) {
      return res.status(400).json({ error: 'Invalid SchemaId format (3-16 lowercase chars)' });
    }  
    //const schemaId1 = `mod:${accountId.split(':')[1]}:${schemaId}`;
    const schemaId1 = await generateScopedId('mod', accountId.split(':')[1], 'schema', schemaId);

    // Setelah generate schemaId1
    const existing = await findFromGateway('states', {
      entityType: 'schema',
      refId: schemaId1
    });
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: `Schema ${schemaId} already exists`});
    }

    if (!entityType || !['coin', 'asset', 'contract', 'data'].includes(entityType)) {
      return res.status(400).json({ error: 'Missing or invalid entityType' });
    }

    if (!format_type || !['actor', 'unique', 'commodity'].includes(format_type)) {
      return res.status(400).json({ error: 'Missing or invalid format_type' });
    }

    if (workflow) {
      for (const [i, step] of workflow.entries()) {
        if (typeof step.level !== 'number') {
          return res.status(400).json({ error: `Workflow step ${i} missing or invalid 'level' (must be number)` });
        }
        if (typeof step.label !== 'string') {
          return res.status(400).json({ error: `Workflow step ${i} missing or invalid 'label'` });
        }
        if (!Array.isArray(step.allow) || step.allow.some(a => typeof a !== 'string')) {
          return res.status(400).json({ error: `Workflow step ${i} 'allow' must be array of strings` });
        }
        if (step.require && (!Array.isArray(step.require) || step.require.some(r => typeof r !== 'string'))) {
          return res.status(400).json({ error: `Workflow step ${i} 'require' must be array of strings (if provided)` });
        }
        if (step.final !== undefined && typeof step.final !== 'boolean') {
          return res.status(400).json({ error: `Workflow step ${i} 'final' must be boolean (if provided)` });
        }
      }
    }

    const result = await sendEvent({
      type: 'schema.create',
      data: {
        schemaId:schemaId1,
        entityType,
        format_type,
        description,
        fields,
        reducerCode,
        version,
        workflow: workflow || []
      },
      account: accountId,
      actor
    });

    res.status(201).json({ message: 'Schema creation event submitted', event: result.data });
  } catch (err) {
    console.error('Failed to create schema:', err.message);
    res.status(500).json({ error: 'Failed to create schema' });
  }
};
