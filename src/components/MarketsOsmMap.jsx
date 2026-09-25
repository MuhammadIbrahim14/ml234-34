import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/** OpenStreetMap map of markets using DB latitude/longitude. */
export default function MarketsOsmMap({ markets = [], selectedId = null, onSelect, height = 420 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const withCoords = useMemo(
    () =>
      (markets || []).filter(
        (m) =>
          m.latitude != null &&
          m.longitude != null &&
          !Number.isNaN(Number(m.latitude)) &&
          !Number.isNaN(Number(m.longitude))
      ),
    [markets]
  );

  const coordKey = withCoords.map((m) => `${m.market_id}:${m.latitude}:${m.longitude}`).join('|');

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

    if (!withCoords.length) {
      map.setView([31.5204, 74.3587], 11);
      return;
    }

    const bounds = L.latLngBounds([]);
    withCoords.forEach((m) => {
      const lat = Number(m.latitude);
      const lng = Number(m.longitude);
      const marker = L.marker([lat, lng], { title: m.market_name });
      marker.bindPopup(
        `<strong>${m.market_name || 'Market'}</strong><br/>${m.address || 'Address TBD'}${
          m.timings ? `<br/>${m.timings}` : ''
        }`
      );
      marker.on('click', () => onSelectRef.current?.(m));
      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.extend([lat, lng]);
    });

    if (withCoords.length === 1) {
      map.setView([Number(withCoords[0].latitude), Number(withCoords[0].longitude)], 13);
    } else {
      map.fitBounds(bounds.pad(0.2));
    }
    setTimeout(() => map.invalidateSize(), 80);
  }, [coordKey, withCoords]);

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
      {!withCoords.length && (
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
