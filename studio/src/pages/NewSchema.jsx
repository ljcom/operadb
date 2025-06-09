// src/pages/NewSchema.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountContext } from '../utils/AccountContext';

export default function NewSchemaPage() {
  const { selectedAccount } = useContext(AccountContext);
  const navigate = useNavigate();
  const [schemaId, setSchemaId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [version, setVersion] = useState('1');
  const [description, setDescription] = useState('');
  const [reducerCode, setReducerCode] = useState('');
  const [fields, setFields] = useState([
    { name: '', type: '', required: false }
  ]);
  const [workflowJson, setWorkflowJson] = useState('[]');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Supported types for fields
  const fieldTypeOptions = ['string', 'number', 'boolean', 'address', 'date', 'datetime', 'array'];

  // Entity types as per controller defaultFieldsMap keys
  const entityOptions = [
    'coin', 'actor.org', 'actor.people',
    'asset.unique', 'asset.commodity',
    'contract', 'data'
  ];

  const addField = () => {
    setFields([...fields, { name: '', type: '', required: false }]);
  };
  const removeField = (idx) => {
    setFields(fields.filter((_, i) => i !== idx));
  };
  const updateField = (idx, key, value) => {
    const updated = [...fields];
    updated[idx] = { ...updated[idx], [key]: value };
    setFields(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      setError('Pilih akun terlebih dahulu.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const workflow = JSON.parse(workflowJson);
      const payload = {
        schemaId,
        entityType,
        version,
        description,
        reducerCode,
        fields,
        workflow
      };
      const res = await fetch('http://localhost:3000/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat schema');
      // Redirect back to schemas list
      navigate('/dashboard/schemas');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '720px', margin: 'auto' }}>
      <h2>New Schema{selectedAccount ? ` – ${selectedAccount}` : ''}</h2>
      {error && <p style={{ color: '#E53E3E' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label>Schema ID</label><br />
          <input value={schemaId} onChange={e => setSchemaId(e.target.value)} required />
        </div>
        <div>
          <label>Entity Type</label><br />
          <select value={entityType} onChange={e => setEntityType(e.target.value)} required>
            <option value="">-- pilih entity --</option>
            {entityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label>Version</label><br />
          <input type="text" value={version} onChange={e => setVersion(e.target.value)} required />
        </div>
        <div>
          <label>Description</label><br />
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label>Reducer Code</label><br />
          <textarea rows={4} value={reducerCode} onChange={e => setReducerCode(e.target.value)} required />
        </div>
        <fieldset style={{ padding: '12px', border: '1px solid #CBD5E0' }}>
          <legend>Fields</legend>
          {fields.map((f, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                placeholder="name"
                value={f.name}
                onChange={e => updateField(idx, 'name', e.target.value)}
                required
              />
              <select
                value={f.type}
                onChange={e => updateField(idx, 'type', e.target.value)}
                required
              >
                <option value="">type</option>
                {fieldTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={e => updateField(idx, 'required', e.target.checked)}
                /> Required
              </label>
              <button type="button" onClick={() => removeField(idx)}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addField}>Add Field</button>
        </fieldset>
        <div>
          <label>Workflow (JSON array)</label><br />
          <textarea rows={4} value={workflowJson} onChange={e => setWorkflowJson(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '8px 16px', backgroundColor: '#3182CE', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Creating...' : 'Create Schema'}
        </button>
      </form>
    </div>
  );
}
