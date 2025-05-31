const { sendEvent } = require('../utils/eventSender');
const { generateScopedId, isValidIdFormat } = require('../utils/idNaming');
const { findFromGateway } = require('../utils/gatewayQuery');

const defaultFieldsMap = {
  coin: [
    { name: 'symbol', type: 'string', required: true },
    { name: 'decimals', type: 'number', required: true },
    { name: 'totalSupply', type: 'number', required: true },
    { name: 'to', type: 'string', required: false }
  ],
  asset: [
    { name: 'assetId', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'qty', type: 'number', required: true },
    { name: 'formatType', type: 'string', required: true },
    { name: 'unit', type: 'string', required: false }
  ],
  contract: [
    { name: 'contractId', type: 'string', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'partyA', type: 'string', required: true },
    { name: 'partyB', type: 'string', required: true },
    { name: 'effectiveDate', type: 'date', required: false },
    { name: 'expiryDate', type: 'date', required: false }
  ],
  data: [
    { name: 'dataId', type: 'string', required: true },
    { name: 'source', type: 'string', required: true },
    { name: 'value', type: 'string', required: true },
    { name: 'timestamp', type: 'datetime', required: false }
  ]
};

exports.createSchema = async (req, res) => {
  try {
    const { schemaId, description, fields, reducerCode, entityType,
        version, workflow, formatType } = req.body;

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

    if (entityType=='asset') {
      if (!formatType || !['actor', 'unique', 'commodity'].includes(formatType)) {
        return res.status(400).json({ error: 'Missing or invalid formatType' });
      }
    }

    if (defaultFieldsMap[entityType]) {
      const fieldMap = Object.fromEntries(fields.map(f => [f.name, f]));

      for (const def of defaultFieldsMap[entityType]) {
        const match = fieldMap[def.name];
        if (!match || match.type !== def.type) {
          return res.status(400).json({
            error: `Missing or incorrect required field for ${entityType}: ${def.name} (type: ${def.type})`
          });
        }
      }
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
        formatType,
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
