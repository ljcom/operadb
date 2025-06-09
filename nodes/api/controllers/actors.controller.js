const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { generateScopedId, isValidAddressFormat } = require('../utils/idNaming');

// 1. Register actor
exports.registerActor = async (req, res) => {
  try {
    const { actorId, actorType, role, represented, pic, address, schemaId } = req.body;
    const actor = req.address;
    const accountId = req.accountId;

    if (!actorType || !actorId || !schemaId) {
      return res.status(400).json({ error: 'Missing required field in schemaId, actorId, actorType (corp, user)' });
    }

    if (actorType=='corp' &&!represented) {
      return res.status(400).json({ error: 'Missing required field in represented' });
    }

    const schemaId1 = await generateScopedId('mod', accountId.split(':')[1], 'schema', schemaId);
    const schemaRes = await findFromGateway('states', {
      entityType: 'schema',
      refId: schemaId1,
      account: accountId
    });
    const schema = schemaRes?.[0];
    if (!schema) {
      return res.status(400).json({ error: 'Invalid schemaId or not for actor' });
    }
    const type = schemaId1.split(':')[2];

    const fields = schema.state[schemaId1].fields || [];
    for (const field of fields) {
      if (field.required && (field.name === undefined || field.name === null)) {
        return res.status(400).json({ error: `Missing required field in metadata: ${field.name}` });
      }
    }

    // Generate assetId
    const actorId1 = await generateScopedId('act', accountId.split(':')[1], 'actor', type, actorId);

    const fullEntityType = schema.state[schemaId1]?.entityType;
    if (!['actor.corp', 'actor.people'].includes(fullEntityType)) {
      return res.status(400).json({ error: 'Invalid entityType for minting' });
    }

    if (address && !isValidAddressFormat(address)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    
    const result = await sendEvent({
      type: 'actor.register',
      data: {
        actorId1,
        actorType,       // "corp" or "user"
        role,            // "customer", "supplier", etc
        represented,     // e.g., "org:corporateX"
        schemaId,
        type,
        address,
        pic: pic || [],
        status: 'pending',
        notifyOnly: true
      },
      actor,
      account: accountId
    });

    res.status(201).json({ message: 'Actor registered', event: result.data });
  } catch (err) {
    console.error('Register actor failed:', err.message);
    res.status(500).json({ error: 'Failed to register actor' });
  }
};

// 2. List actors
exports.listActors = async (req, res) => {
  try {
    const accountId = req.accountId;
    const result = await findFromGateway('states', {
      entityType: 'actor',
      account: accountId
    });

    res.status(200).json(result || []);
  } catch (err) {
    console.error('List actors failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch actors' });
  }
};

// 3. Get actor detail
exports.getActor = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await findFromGateway('states', {
      entityType: 'actor',
      entityId: id
    });

    if (!result?.length) {
      return res.status(404).json({ error: 'Actor not found' });
    }

    res.status(200).json(result[0]);
  } catch (err) {
    console.error('Get actor failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch actor' });
  }
};

// 4. Approve actor (by represented party)
exports.approveActor = async (req, res) => {
  try {
    const { actorId } = req.body;
    const actor = req.address;

    const state = await findFromGateway('states', {
      entityType: 'actor',
      entityId: actorId
    });

    if (!state?.length) return res.status(404).json({ error: 'Actor not found' });

    const actorData = state[0];

    // Cek apakah yang approve adalah dari organisasi yang benar
    if (!actorData?.represented || !actor.startsWith(actorData.represented)) {
      return res.status(403).json({ error: 'Unauthorized to approve this actor' });
    }

    const result = await sendEvent({
      type: 'actor.approve',
      data: { actorId },
      actor,
      account: null
    });

    res.status(200).json({ message: 'Actor approved', event: result.data });
  } catch (err) {
    console.error('Approve actor failed:', err.message);
    res.status(500).json({ error: 'Failed to approve actor' });
  }
};

exports.updateActor = async (req, res) => {
  try {
    const { actorId, pic, address, note, label } = req.body;
    const actor = req.address;
    const accountId = req.accountId;

    if (!actorId) {
      return res.status(400).json({ error: 'Missing actorId' });
    }

    // Ambil actor state untuk validasi
    const actorState = await findFromGateway('states', {
      entityType: 'actor',
      entityId: actorId
    });

    const state = actorState?.[0];
    if (!state) {
      return res.status(404).json({ error: 'Actor not found' });
    }

    if (state.account !== accountId) {
      return res.status(403).json({ error: 'Only the registering account can update this actor' });
    }

    if (address && !isValidAddressFormat(address)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }

    const updatePayload = {
      actorId
    };

    if (Array.isArray(pic)) updatePayload.pic = pic;
    if (address) updatePayload.address = address;
    if (label) updatePayload.label = label;
    if (note) updatePayload.note = note;

    const result = await sendEvent({
      type: 'actor.update',
      data: updatePayload,
      actor,
      account: accountId
    });

    res.status(200).json({ message: 'Actor updated', event: result.data });
  } catch (err) {
    console.error('Update actor failed:', err.message);
    res.status(500).json({ error: 'Failed to update actor' });
  }
};