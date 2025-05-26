exports.replay = function (events) {
  if (!events || events.length === 0) return {};

  const latest = events[events.length - 1];
  if (!latest?.data) return {};

  return {
    email: latest.data.email,
    address: latest.data.address
  };
};