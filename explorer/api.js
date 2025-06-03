const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function getLatestEvents(limit = 50) {
  console.log('[api.js] Memanggil:', `${BASE_URL}/events?limit=${limit}`);
  const res = await fetch(`${BASE_URL}/events?limit=${limit}`);
  console.log('[api.js] Response status:', res.status);
  if (!res.ok) {
    throw new Error(`Failed to fetch events (${res.status})`);
  }
  const data = await res.json();
  console.log('[api.js] Data yang diterima:', data);
  return data;
}

export async function getStateSummary() {
  // Hardcoded example: coin / asset / dsb
  const res = await fetch(`${BASE_URL}/states`);
  if (!res.ok) throw new Error(`Failed to fetch states: ${res.status}`);
  return res.json();
}

// Pastikan fungsi ini ada dan diekspor
export async function getStateByEntity(entity, refId) {
  const res = await fetch(
    `${BASE_URL}/states/${entity}/${encodeURIComponent(refId)}`
  );
  if (!res.ok) throw new Error(`Failed to fetch state (${res.status})`);
  return res.json();
}
