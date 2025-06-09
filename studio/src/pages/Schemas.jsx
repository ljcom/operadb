// src/pages/Schemas.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountContext } from '../utils/AccountContext';

export default function SchemasPage() {
  const { selectedAccount } = useContext(AccountContext);
  const navigate = useNavigate();
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedAccount) return;
    const fetchSchemas = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `http://localhost:3000/schemas?account=${encodeURIComponent(selectedAccount)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memuat schemas');
        setSchemas(data);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchSchemas();
  }, [selectedAccount]);

  const handleNewSchema = () => {
    navigate('/dashboard/schemas/new');
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Schemas{selectedAccount ? ` - ${selectedAccount}` : ''}</h2>
        <button
          onClick={handleNewSchema}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3182CE',
            color: '#FFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          New Schema
        </button>
      </div>

      {error && <p style={{ color: '#E53E3E' }}>{error}</p>}
      {loading ? (
        <p>Loading schemas...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {schemas.length > 0 ? (
            schemas.map((schema) => (
              <div
                key={schema.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#FFF',
                  borderRadius: '4px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0' }}>{schema.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                  {schema.description}
                </p>
              </div>
            ))
          ) : (
            <p style={{ color: '#666' }}>No schemas found for this account.</p>
          )}
        </div>
      )}
    </div>
  );
}