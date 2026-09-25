import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { hasCoords, searchPlaces } from '../lib/api/geo';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [31.5204, 74.3587];
const DEFAULT_ZOOM = 12;

/**
 * Click-to-set map pin + place search. Calls onChange(lat, lng) as numbers.
 * Controlled via latitude / longitude string or number props.
 */
export default function LocationPickerMap({ latitude, longitude, onChange, height = 220 }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const start = hasCoords(latitude, longitude)
      ? [Number(latitude), Number(longitude)]
      : DEFAULT_CENTER;
    const zoom = hasCoords(latitude, longitude) ? 15 : DEFAULT_ZOOM;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(start, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (hasCoords(latitude, longitude)) {
      markerRef.current = L.marker(start, { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng();
        onChangeRef.current?.(p.lat, p.lng);
      });
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const p = markerRef.current.getLatLng();
          onChangeRef.current?.(p.lat, p.lng);
        });
      }
      onChangeRef.current?.(lat, lng);
    });

    mapRef.current = map;
    const tmr = setTimeout(() => map.invalidateSize(), 80);

    return () => {
      clearTimeout(tmr);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Mount once; external coord sync is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!hasCoords(latitude, longitude)) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const next = L.latLng(lat, lng);

    if (markerRef.current) {
      const cur = markerRef.current.getLatLng();
      if (Math.abs(cur.lat - lat) > 1e-7 || Math.abs(cur.lng - lng) > 1e-7) {
        markerRef.current.setLatLng(next);
        map.panTo(next);
      }
    } else {
      markerRef.current = L.marker(next, { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng();
        onChangeRef.current?.(p.lat, p.lng);
      });
      map.setView(next, Math.max(map.getZoom(), 15));
    }
  }, [latitude, longitude]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchErr('');
      setSearchBusy(false);
      return undefined;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setSearchBusy(true);
      setSearchErr('');
      const { data, error } = await searchPlaces(q, { limit: 5, signal: ctrl.signal });
      setSearchBusy(false);
      if (error) {
        if (String(error).toLowerCase().includes('unavailable')) setSearchErr('unavailable');
        else setSearchErr('failed');
      }
      setResults(data || []);
    }, 400);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  function pickResult(place) {
    onChangeRef.current?.(place.latitude, place.longitude);
    setQuery(place.label);
    setResults([]);
    setSearchErr('');
    const map = mapRef.current;
    if (map) map.setView([place.latitude, place.longitude], 16);
  }

  const errText =
    searchErr === 'failed'
      ? t('map.searchFailed')
      : searchErr === 'unavailable'
        ? t('map.searchUnavailable')
        : '';

  return (
    <div className="location-picker-wrap">
      <div className="location-picker-search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('map.searchPlaceholder')}
          autoComplete="off"
        />
        {searchBusy ? <span className="location-picker-search-status">{t('map.searching')}</span> : null}
        {errText ? <span className="location-picker-search-status err">{errText}</span> : null}
        {results.length > 0 && (
          <ul className="location-picker-results">
            {results.map((r) => (
              <li key={`${r.latitude},${r.longitude},${r.label}`}>
                <button type="button" onClick={() => pickResult(r)}>
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div
        ref={containerRef}
        className="location-picker-map"
        style={{ height }}
        role="img"
        aria-label={t('map.aria')}
      />
      <p className="location-picker-hint">{t('map.hint')}</p>
    </div>
  );
}
