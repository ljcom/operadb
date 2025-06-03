// src/components/SearchBar.jsx
import React from 'react';

export default function SearchBar({
  placeholder,
  query,
  onChange,
  onSubmit
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{
        margin: '1rem 0',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '60%',
          padding: '0.5rem 1rem',
          border: '1px solid #ccc',
          borderRadius: '4px 0 0 4px',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        style={{
          padding: '0.5rem 1rem',
          border: '1px solid #4a90e2',
          backgroundColor: '#4a90e2',
          color: '#fff',
          borderRadius: '0 4px 4px 0',
          cursor: 'pointer',
        }}
      >
        Search
      </button>
    </form>
  );
}