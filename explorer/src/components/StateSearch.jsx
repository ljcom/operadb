// src/components/StateSearch.jsx
import React, { useState } from 'react';
import { getStateByEntity } from '../../api.js';

export default function StateSearch() {
  const [entity, setEntity] = useState('');
  const [refId, setRefId] = useState('');
  const [stateData, setStateData] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!entity || !refId) return;
    try {
      const data = await getStateByEntity(entity, refId);
      setStateData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setStateData(null);
    }
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          placeholder="Entity (misal: coin)"
          style={{
            padding: '0.5rem',
            width: '40%',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginRight: '0.5rem',
          }}
        />
        <input
          type="text"
          value={refId}
          onChange={(e) => setRefId(e.target.value)}
          placeholder="Ref ID (misal: coin:abc123)"
          style={{
            padding: '0.5rem',
            width: '40%',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginRight: '0.5rem',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4a90e2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cari
        </button>
      </div>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {stateData && (
        <div
          style={{
            background: '#f9f9f9',
            border: '1px solid #ddd',
            padding: '1rem',
            borderRadius: '4px',
            fontFamily: 'Courier, monospace',
          }}
        >
          <h3>State untuk {entity}/{refId}:</h3>
          <pre>{JSON.stringify(stateData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}