exports.replay = function (events, baseState = {}) {
  if (!events || events.length === 0) return baseState;

  const latest = events.at(-1);
  if (!latest?.data) return baseState;

  return {
    ...baseState,
    address: latest.data.address.toLowerCase(),
    admin_user: latest.data.admin_user // ← optional, jika kamu simpan
  };
};