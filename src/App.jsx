import { useEffect, useState } from 'react';
import MapView from './MapView.jsx';
import { loadProjects } from './lib/loadProjects.js';
import { colorForConfidence } from './statusColors.js';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [source, setSource] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [filterTier, setFilterTier] = useState('all'); // 'all' | 'low' | 'medium' | 'high'

  useEffect(() => {
    loadProjects().then(({ projects, source }) => {
      setProjects(projects);
      setSource(source);
    });
  }, []);

  if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="setup-message">
        Add <code>VITE_MAPBOX_ACCESS_TOKEN</code> to <code>.env.local</code> and restart <code>npm run dev</code>.
      </div>
    );
  }

  const filteredProjects = projects.filter((p) => {
    if (filterTier === 'all') return true;
    if (filterTier === 'low') return p.confidence_count === 1;
    if (filterTier === 'medium') return p.confidence_count === 2;
    if (filterTier === 'high') return p.confidence_count >= 3;
    return true;
  });

  const selected = filteredProjects.find((p) => p.parcel_id === selectedId);

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Harris County Development Tracker</h1>
        <p className="source">
          {source === 'supabase' && 'Live data from Supabase'}
          {source === 'sample' && 'Sample data (no Supabase keys set)'}
          {!source && 'Loading…'}
          {source && ` · ${filteredProjects.length} parcels`}
        </p>

        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="filter-select">
          <option value="all">All confidence levels</option>
          <option value="low">Low (1 method)</option>
          <option value="medium">Medium (2 methods)</option>
          <option value="high">High (3+ methods)</option>
        </select>

        {selected && (
          <div className="detail">
            <h2>{selected.subdivision || selected.address}</h2>
            <p>{selected.address}{selected.zipcode && `, ${selected.zipcode}`}</p>
            <p>Status: {selected.status}</p>
            <p>Confidence: {selected.confidence_count} method(s) — {selected.data_sources}</p>
            {selected.saledate && <p>Sale date: {selected.saledate}</p>}
            {selected.new_construction_val > 0 && <p>New construction value: ${selected.new_construction_val.toLocaleString()}</p>}
          </div>
        )}

        <ul className="project-list">
          {filteredProjects.map((p) => (
            <li key={p.parcel_id}>
              <button
                className={p.parcel_id === selectedId ? 'active' : ''}
                onClick={() => setSelectedId(p.parcel_id)}
              >
                <span className="dot" style={{ background: colorForConfidence(p.confidence_count) }} />
                {p.address || p.subdivision}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <MapView projects={filteredProjects} selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}