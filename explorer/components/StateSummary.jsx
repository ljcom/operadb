import React, { useEffect, useState } from 'react';
import { getStateSummary } from '../../api.js';

export default function StateSummary() {
  const [states, setStates] = useState([]);

  useEffect(() => {
    const fetchStates = async () => {
      const data = await getStateSummary();
      setStates(data);
    };
    fetchStates();
    const interval = setInterval(fetchStates, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>📊 State Summary</h2>
      <ul>
        {states.map((s, i) => (
          <li key={i}>
            {s.entityType} {s.refId}: {JSON.stringify(s.summary)}
          </li>
        ))}
      </ul>
    </div>
  );
}