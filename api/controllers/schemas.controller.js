const { sendEvent } = require('../utils/eventSender');
const { generateScopedId, isValidNamespace } = require('../utils/idNaming');

exports.createSchema = async (req, res) => {
  try {
    const { description, fields, reducerCode, version, workflow, format_type } = req.body;

    const accountId = req.accountId;
    
    const schemaId = await generateScopedId('schema', accountId, format_type, description);
    const actor = req.user.id;

    if (!schemaId || !reducerCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!format_type || !['coin', 'asset', 'contract', 'data'].includes(format_type)) {
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
        schemaId,
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
