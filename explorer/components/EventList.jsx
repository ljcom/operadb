import React, { useEffect, useState } from 'react';
import { getLatestEvents } from '../../api.js';

export default function EventList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await getLatestEvents();
      setEvents(data);
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>🧾 Event Feed (Latest First)</h2>
      <ul>
        {events.map((e, i) => (
          <li key={i}>
            [{e.timestamp}] <strong>{e.entityType}</strong>: {e.action} → {e.refId}
          </li>
        ))}
      </ul>
    </div>
  );
}