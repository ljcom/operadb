// client/src/App.jsx
import React, { useState } from 'react';
import Navbar      from './components/Navbar.jsx';
import SearchBar   from './components/SearchBar.jsx';
import EventList   from './components/EventList.jsx';
import StateSearch from './components/StateSearch.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('events');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      {/* Navbar */}
      <Navbar activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Search Bar hanya di tab “Events” */}
      <div style={{ backgroundColor: '#fafafa', padding: '0.5rem 0' }}>
        {activeTab === 'events' ? (
          <SearchBar
            placeholder="Cari event (tipe atau data)..."
            query={searchTerm}
            onChange={setSearchTerm}
            onSubmit={() => {}}
          />
        ) : (
          <></>
        )}
      </div>

      {/* Konten berdasarkan tab */}
      {activeTab === 'events' ? (
        <EventList searchTerm={searchTerm} />
      ) : (
        <StateSearch />
      )}
    </div>
  );
}