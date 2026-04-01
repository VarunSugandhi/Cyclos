import { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { TbSparkles, TbLoader2, TbX } from 'react-icons/tb';
import { getChatResponse } from '../services/nvidiaNim';
import './MapSection.css';

// Ocean center (Indian Ocean)
const BASE_LAT = -8.0;
const BASE_LNG = 75.0;

function generatePoints(count = 60) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    // Spread widely across the ocean
    lat: BASE_LAT + (Math.random() - 0.5) * 40,
    lng: BASE_LNG + (Math.random() - 0.5) * 60,
    title: [
      'Great Garbage Patch', 'Ocean Gyre Center', 'Shipping Lane Debris',
      'Subtropical Convergence', 'Deep Ocean Trench', 'Remote Atoll Coast',
      'Equatorial Current', 'Microplastic Hotspot', 'Reef Buffer Zone'
    ][Math.floor(Math.random() * 9)],
    kg: Math.floor(Math.random() * 5000 + 500),
    type: ['Most Polluted', 'High Traffic', 'Remote/Less Explored'][Math.floor(Math.random() * 3)],
    distance: (Math.random() * 2000 + 100).toFixed(0),
  }));
}

const POINTS = generatePoints(60);

const COLOR_MAP = {
  'Most Polluted': '#ef4444', /* Red */
  'High Traffic': '#f59e0b', /* Orange */
  'Remote/Less Explored': '#38bdf8', /* Cyan */
};

function DarkMap() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

export default function MapSection({ domain }) {
  const points = useMemo(() => POINTS, []);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const summary = points.map(p => `${p.title}: ${p.type} (${p.kg}kg)`).join(', ');
      const response = await getChatResponse([
        { 
          role: 'user', 
          content: `Here is a summary of waste collection points in this map area: ${summary}. Please provide a 2-sentence expert environmental summary of this region's waste profile.` 
        }
      ]);
      setInsight(response);
    } catch (err) {
      console.error(err);
      setInsight("Unable to generate insight at this time.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="map-section"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="map-section__legend">
        {Object.entries(COLOR_MAP).map(([type, color]) => (
          <div key={type} className="map-section__legend-item">
            <span className="map-section__legend-dot" style={{ background: color }} />
            <span>{type}</span>
          </div>
        ))}
      </div>

      <div className="map-container">
        <MapContainer
          center={[BASE_LAT, BASE_LNG]}
          zoom={4}
          style={{ height: '100%', width: '100%', borderRadius: '16px' }}
          zoomControl={false}
          attributionControl={false}
        >
          <DarkMap />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CartoDB"
          />
          {points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={8 + (p.kg / 5000) * 15} // Make radius depend on weight for a heat map feel
              pathOptions={{
                color: COLOR_MAP[p.type],
                fillColor: COLOR_MAP[p.type],
                fillOpacity: 0.5,
                weight: 0,
                opacity: 0.8,
              }}
            >
              <Popup className="map-popup">
                <div className="map-popup__inner">
                  <strong>{p.title}</strong>
                  <span>📦 {p.type} · {p.kg} kg</span>
                  <span>📍 ~{p.distance} km away</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <button 
          className={`map-ai-btn ${loading ? 'loading' : ''}`} 
          onClick={generateInsight}
          disabled={loading}
        >
          {loading ? <TbLoader2 className="spinner" /> : <TbSparkles />}
          <span>AI Insight</span>
        </button>

        <AnimatePresence>
          {insight && (
            <motion.div 
              className="map-ai-overlay"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="map-ai-overlay__header">
                <span><TbSparkles size={14} /> ENVIRONMENTAL INSIGHT</span>
                <button onClick={() => setInsight(null)}><TbX size={14} /></button>
              </div>
              <p>{insight}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="map-section__note">
        📍 Nearest ocean/sea is 300 kms far
      </p>
    </motion.div>
  );
}
