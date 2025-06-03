// src/components/EventList.jsx
import React, { useEffect, useState } from 'react';
import { getLatestEvents } from '../../api.js';

export default function EventList({ searchTerm }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getLatestEvents(100); // misal ambil 100 teratas
        setEvents(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchEvents();
    const id = setInterval(fetchEvents, 10000);
    return () => clearInterval(id);
  }, []);

  // Filter event berdasarkan `type` atau `refId` mengandung searchTerm (case-insensitive)
  const filtered = events.filter((e) => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      e.type.toLowerCase().includes(lower) ||
      JSON.stringify(e.data).toLowerCase().includes(lower)
    );
  });

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '0 1rem', fontFamily: 'Arial, sans-serif' }}>
      {filtered.length === 0 ? (
        <p>(Tidak ada event sesuai pencarian.)</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filtered.map((e) => (
            <li
              key={e._id}
              style={{
                borderBottom: '1px solid #eee',
                padding: '0.75rem 0',
              }}
            >
              <div style={{ fontSize: '0.9rem', color: '#888' }}>
                {new Date(e.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>{e.type}</strong> →{' '}
                <span style={{ fontFamily: 'Courier, monospace' }}>
                  {JSON.stringify(e.data)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}