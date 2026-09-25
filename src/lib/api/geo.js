/** External map / directions helpers (no API key). */

export function hasCoords(lat, lng) {
  return (
    lat != null &&
    lng != null &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lng))
  );
}

/**
 * Parse lat/lng from Google Maps, OpenStreetMap, geo:, or "lat,lng" paste.
 * Returns { latitude, longitude } or null.
 */
export function parseCoordsFromMapUrl(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;

  const pair = (a, b) => {
    const latitude = Number(a);
    const longitude = Number(b);
    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return null;
    }
    return { latitude, longitude };
  };

  // Plain "lat, lng"
  const plain = text.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (plain) return pair(plain[1], plain[2]);

  // geo:lat,lng
  const geo = text.match(/^geo:(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i);
  if (geo) return pair(geo[1], geo[2]);

  try {
    const u = new URL(text);

    // OSM ?mlat=&mlon=
    const mlat = u.searchParams.get('mlat');
    const mlon = u.searchParams.get('mlon');
    if (mlat != null && mlon != null) {
      const p = pair(mlat, mlon);
      if (p) return p;
    }

    // Google/common ?q=lat,lng or ?query=
    for (const key of ['q', 'query', 'll', 'center']) {
      const v = u.searchParams.get(key);
      if (!v) continue;
      const m = v.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
      if (m) {
        const p = pair(m[1], m[2]);
        if (p) return p;
      }
    }

    // Google @lat,lng,zoom
    const at = text.match(/@(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (at) {
      const p = pair(at[1], at[2]);
      if (p) return p;
    }

    // OSM #map=zoom/lat/lng
    const osmHash = (u.hash || '').match(/map=\d+\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
    if (osmHash) {
      const p = pair(osmHash[1], osmHash[2]);
      if (p) return p;
    }

    // destination=lat,lng (Google directions)
    const dest = u.searchParams.get('destination');
    if (dest) {
      const m = dest.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
      if (m) {
        const p = pair(m[1], m[2]);
        if (p) return p;
      }
    }
  } catch {
    // not a URL — fall through
  }

  // Last resort: first lat,lng pair in the string
  const any = text.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (any) return pair(any[1], any[2]);

  return null;
}

/** Google Maps directions (destination only). */
export function googleDirectionsUrl(lat, lng) {
  if (!hasCoords(lat, lng)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${Number(lat)},${Number(lng)}`;
}

/** OpenStreetMap place marker with route entry point. */
export function osmDirectionsUrl(lat, lng) {
  if (!hasCoords(lat, lng)) return null;
  const la = Number(lat);
  const ln = Number(lng);
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${la},${ln}#map=15/${la}/${ln}`;
}

/**
 * Free place search via OpenStreetMap Nominatim (no API key).
 * Returns [{ label, latitude, longitude }, ...] or { error }.
 */
export async function searchPlaces(query, { limit = 5, signal } = {}) {
  const q = String(query || '').trim();
  if (q.length < 2) return { data: [], error: null };

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('addressdetails', '0');

  try {
    const res = await fetch(url.toString(), {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { data: [], error: 'Location search failed. Try again.' };
    const rows = await res.json();
    const data = (Array.isArray(rows) ? rows : [])
      .map((r) => {
        const latitude = Number(r.lat);
        const longitude = Number(r.lon);
        if (!hasCoords(latitude, longitude)) return null;
        return {
          label: r.display_name || `${latitude}, ${longitude}`,
          latitude,
          longitude,
        };
      })
      .filter(Boolean);
    return { data, error: null };
  } catch (err) {
    if (err?.name === 'AbortError') return { data: [], error: null };
    return { data: [], error: 'Location search unavailable.' };
  }
}
