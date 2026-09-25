import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { googleDirectionsUrl, osmDirectionsUrl, hasCoords } from '../lib/api/geo';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const farmerIcon = L.divIcon({
  className: 'ml-farmer-pin',
  html: '<span class="ml-farmer-pin-dot" title="Farmer"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -8],
});

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function directionsLinksHtml(lat, lng) {
  const g = googleDirectionsUrl(lat, lng);
  const o = osmDirectionsUrl(lat, lng);
  if (!g && !o) return '';
  const parts = [];
  if (g) parts.push(`<a href="${g}" target="_blank" rel="noopener noreferrer">Google Directions</a>`);
  if (o) parts.push(`<a href="${o}" target="_blank" rel="noopener noreferrer">OSM</a>`);
  return `<br/>${parts.join(' · ')}`;
}

/**
 * OpenStreetMap map of markets (+ optional farmer pins) using DB latitude/longitude.
 */
export default function MarketsOsmMap({
  markets = [],
  farmers = [],
  selectedId = null,
  onSelect,
  height = 420,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const withCoords = useMemo(
    () => (markets || []).filter((m) => hasCoords(m.latitude, m.longitude)),
    [markets]
  );

  const farmersWithCoords = useMemo(
    () => (farmers || []).filter((f) => hasCoords(f.latitude, f.longitude)),
    [farmers]
  );

  const coordKey = [
    withCoords.map((m) => `${m.market_id}:${m.latitude}:${m.longitude}`).join('|'),
    farmersWithCoords.map((f) => `${f.user_id || f.id}:${f.latitude}:${f.longitude}`).join('|'),
  ].join('||');

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([31.5204, 74.3587], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 80);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = [];

    if (!withCoords.length && !farmersWithCoords.length) {
      map.setView([31.5204, 74.3587], 11);
      return;
    }

    const bounds = L.latLngBounds([]);
    withCoords.forEach((m) => {
      const lat = Number(m.latitude);
      const lng = Number(m.longitude);
      const marker = L.marker([lat, lng], { title: m.market_name });
      marker.bindPopup(
        `<strong>${escapeHtml(m.market_name || 'Market')}</strong><br/>${escapeHtml(m.address || 'Address TBD')}${
          m.timings ? `<br/>${escapeHtml(m.timings)}` : ''
        }${directionsLinksHtml(lat, lng)}`
      );
      marker.on('click', () => onSelectRef.current?.(m));
      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.extend([lat, lng]);
    });

    farmersWithCoords.forEach((f) => {
      const lat = Number(f.latitude);
      const lng = Number(f.longitude);
      const label = f.stall_name || f.profiles?.full_name || 'Farmer';
      const marker = L.marker([lat, lng], { title: label, icon: farmerIcon });
      marker.bindPopup(
        `<strong>${escapeHtml(label)}</strong><br/><span>Farmer stall</span>${directionsLinksHtml(lat, lng)}`
      );
      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.extend([lat, lng]);
    });

    const total = withCoords.length + farmersWithCoords.length;
    if (total === 1) {
      const only = withCoords[0] || farmersWithCoords[0];
      map.setView([Number(only.latitude), Number(only.longitude)], 13);
    } else {
      map.fitBounds(bounds.pad(0.2));
    }
    setTimeout(() => map.invalidateSize(), 80);
  }, [coordKey, withCoords, farmersWithCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedId == null) return;
    const selected = withCoords.find((m) => m.market_id === selectedId);
    if (selected) {
      map.panTo([Number(selected.latitude), Number(selected.longitude)]);
    }
  }, [selectedId, withCoords]);

  return (
    <div className="osm-map-wrap" style={{ minHeight: height }}>
      <div ref={containerRef} className="osm-map" style={{ minHeight: height }} aria-label="Markets map" />
      {!withCoords.length && !farmersWithCoords.length && (
        <div className="osm-map-empty">
          <p>
            <b>Location pending</b>
            <br />
            Markets will appear on the map once coordinates are set. Browse the list meanwhile.
          </p>
        </div>
      )}
    </div>
  );
}
