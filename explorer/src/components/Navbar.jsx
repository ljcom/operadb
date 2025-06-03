// src/components/Navbar.jsx
import React from 'react';

export default function Navbar({ activeTab, onChangeTab }) {
  const tabStyle = (isActive) => ({
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    borderBottom: isActive ? '3px solid #4a90e2' : '3px solid transparent',
    fontWeight: isActive ? '600' : '400',
  });

  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid #ddd',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#fff'
    }}>
      <div
        style={tabStyle(activeTab === 'events')}
        onClick={() => onChangeTab('events')}
      >
        Events
      </div>
      <div
        style={tabStyle(activeTab === 'states')}
        onClick={() => onChangeTab('states')}
      >
        States
      </div>
    </div>
  );
}