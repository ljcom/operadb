const { sendEvent } = require('../utils/eventSender');
const { generateScopedId, isValidIdFormat } = require('../utils/idNaming');
const { findFromGateway } = require('../utils/gatewayQuery');

const defaultFieldsMap = {
  coin: [
    { name: 'symbol', type: 'string', required: true },
    { name: 'decimals', type: 'number', required: true },
    { name: 'totalSupply', type: 'number', required: true },
    { name: 'to', type: 'address', required: false }
  ],
  "actor.org": [
    { name: 'actorId', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: "represented", type: "string", required: true }, //only org (orgId)
    { name: "address", type: "address", required: false },
    { name: "pic", type: "array", required: false },  //only org
    { name: "label", type: "string", required: false },
    { name: "note", type: "string", required: false },
    { name: "status", type: "string", required: false } //0, 100, 400, 500
  ],
  "actor.people": [
    { name: 'actorId', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: "address", type: "address", required: false },
    { name: "label", type: "string", required: false },
    { name: "note", type: "string", required: false },
    { name: "status", type: "string", required: false } //0, 100, 400, 500
  ],
  "asset.unique": [
    { name: 'assetId', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'owner', type: 'address', required: false },
  ],
  "asset.commodity": [
    { name: 'assetId', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'qty', type: 'number', required: false },
    { name: 'unit', type: 'string', required: false },
    { name: 'owner', type: 'address', required: false },
  ],
  contract: [
    { name: 'contractId', type: 'string', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'partyA', type: 'address', required: true },
    { name: 'partyB', type: 'address', required: true },
    { name: 'effectiveDate', type: 'date', required: false },
    { name: 'expiryDate', type: 'date', required: false },
    { name: "status", type: "string", required: false } //0, 100, 400, 500
  ],
  data: [
    { name: 'dataId', type: 'string', required: true },
    { name: 'source', type: 'string', required: true },
    { name: 'value', type: 'string', required: true },
    { name: 'owner', type: 'address', required: false },
    { name: 'timestamp', type: 'datetime', required: false }
  ]
};

exports.createSchema = async (req, res) => {
  try {
    const { schemaId, description, 
      fields: userFields = [],
      reducerCode, entityType,
      version, workflow } = req.body;

    const accountId = req.accountId;
    const actor = req.address;

    if (!schemaId || !entityType || !version || !reducerCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // validasi entityType
    if (!defaultFieldsMap[entityType]) {
      return res.status(400).json({ error: `Invalid or unsupported entityType: ${entityType}` });
    }

    if (!isValidIdFormat(schemaId)) {
      return res.status(400).json({ error: 'Invalid SchemaId format (3-16 lowercase chars)' });
    }    
    
    const mandatory = defaultFieldsMap[entityType];
    const optional  = userFields.filter(f => !mandatory.some(def => def.name === f.name));


    const seen = new Set();
    for (const f of optional) {
      if (!f.name || typeof f.name !== 'string') {
        return res
          .status(400)
          .json({ error: `Optional field missing valid name` });
      }
      if (!f.type || typeof f.type !== 'string') {
        return res
          .status(400)
          .json({ error: `Optional field '${f.name}' missing/invalid type` });
      }
      if (seen.has(f.name)) {
        return res
          .status(400)
          .json({ error: `Duplicate optional field name: ${f.name}` });
      }
      seen.add(f.name);
    }

    // 4) Gabungkan
    const finalFields = [...mandatory, ...optional];

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

    const schemaScoped = await generateScopedId(
      'mod',
      accountId.split(':')[1],
      'schema',
      schemaId
    );
    const exists = await findFromGateway('states', {
      entityType: 'schema',
      refId: schemaScoped
    });
    if (exists.length) {
      return res.status(409).json({ error: `Schema ${schemaId} already exists` });
    }

    const result = await sendEvent({
      type: 'schema.create',
      data: {
        schemaId: schemaScoped,
        entityType,
        description,
        fields: finalFields,
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

exports.getSchema = async (req, res) => {
try {
    const result = await axios.post(`${GATEWAY}/find`, {
      collection: 'states',
      query: {
        entityType: 'schema',
        account: req.accountId
      }
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });

    const schemas = result.data[0]?.state?.schemas || [];
    res.json(schemas);
  } catch (err) {
    console.error('Failed to fetch schemas from state:', err.message);
    res.status(500).json({ error: 'Failed to fetch schemas' });
  }  
}

exports.findSchema = async (req, res) => {
try {
    const result = await axios.post(`${GATEWAY}/find`, {
      collection: 'states',
      query: {
        entityType: 'schema',
        account: req.accountId
      }
    }, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });

    const schemas = result.data[0]?.state?.schemas || [];
    const found = schemas.find(s => s.schemaId === req.params.schemaId);

    if (!found) return res.status(404).json({ error: 'Schema not found' });
    res.json(found);
  } catch (err) {
    console.error('Failed to fetch schema by name:', err.message);
    res.status(500).json({ error: 'Failed to fetch schema' });
  }  
}