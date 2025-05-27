// utils/schemaValidator.js
function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null && !Array.isArray(v)
      ? flatten(v, `${prefix}${k}.`)
      : [[`${prefix}${k}`, v]]
  );
}

function validateAgainstSchema(data, fields) {
  const flatData = Object.fromEntries(flatten(data));
  for (const key in fields) {
    const expected = fields[key];
    const actual = flatData[key];

    if (expected === 'string' && typeof actual !== 'string') return false;
    if (expected === 'number' && typeof actual !== 'number') return false;
    if (expected === 'boolean' && typeof actual !== 'boolean') return false;
    if (expected === 'date' && (typeof actual !== 'string' || isNaN(Date.parse(actual)))) return false;
    if (expected === 'array' && !Array.isArray(actual)) return false;
  }
  return true;
}

module.exports = { validateAgainstSchema };