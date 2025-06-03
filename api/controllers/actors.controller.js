const { sendEvent } = require('../utils/eventSender');
const { findFromGateway } = require('../utils/gatewayQuery');
const { generateScopedId, isValidAddressFormat } = require('../utils/idNaming');

// 1. Register actor
exports.registerActor = async (req, res) => {
  try {
    const { actorType, role, represented, pic, address } = req.body;
    const actor = req.user.id;
    const accountId = req.accountId;

    if (!actorType || !role || !represented) {
      return res.status(400).json({ error: 'Missing required field: actorType, role, or represented' });
    }

    const actorId = await generateScopedId('act', accountId.split(':')[1], role, represented);

    if (address && !isValidAddressFormat(address)) {
      return res.status(400).json({ error: 'Invalid Public address format' });
    }
    
    const result = await sendEvent({
      type: 'actor.register',
      data: {
        actorId,
        actorType,       // "corp" or "user"
        role,            // "customer", "supplier", etc
        represented,     // e.g., "org:corporateX"
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
    const actor = req.user.id;

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
    const actor = req.user.id;
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