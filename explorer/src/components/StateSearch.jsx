// src/components/StateSearch.jsx
import React, { useState } from 'react';
import { getStateByEntity } from '../../api.js';

export default function StateSearch() {
  const [entity, setEntity] = useState('account');
  const [refId, setRefId] = useState('');
  const [stateData, setStateData] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!entity || !refId) {
      setError('Masukkan Entity dan Ref ID');
      setStateData(null);
      return;
    }
    try {
      const data = await getStateByEntity(entity, refId);
      setStateData(data);
      setError(null);
    } catch (err) {
      setError('State tidak ditemukan untuk ' + entity + '/' + refId);
      setStateData(null);
    }
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '1rem' }}>
        {/* Dropdown Entity */}
        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          style={{
            padding: '0.5rem',
            width: '25%',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginRight: '0.5rem',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <option value="account">account</option>
          <option value="actor">actor</option>
          <option value="asset">asset</option>
          <option value="coin">coin</option>
          <option value="contract">contract</option>
          <option value="group">group</option>
          <option value="schema">schema</option>
          <option value="user">user</option>
        </select>

        {/* Input Ref ID */}
        <input
          type="text"
          value={refId}
          onChange={(e) => setRefId(e.target.value)}
          placeholder="Ref ID (misal: usr:omlxbx54:admin)"
          style={{
            padding: '0.5rem',
            width: '40%',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginRight: '0.5rem',
            fontFamily: 'Arial, sans-serif',
          }}
        />

        {/* Tombol Cari */}
        <button
          onClick={handleSearch}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4a90e2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          Cari
        </button>
      </div>

      {/* Pesan Error */}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {/* Hasil State dalam JSON */}
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