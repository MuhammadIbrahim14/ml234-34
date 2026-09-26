/** Open-Meteo weather (no API key). */

const WMO = {
  0: 'clear',
  1: 'mainlyClear',
  2: 'partlyCloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'sleet',
  67: 'sleet',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'showers',
  81: 'showers',
  82: 'showers',
  85: 'snow',
  86: 'snow',
  95: 'storm',
  96: 'storm',
  99: 'storm',
};

export function weatherKind(code) {
  return WMO[Number(code)] || 'unknown';
}

/** Pickup-friendly tip key suffix based on conditions. */
export function pickupTipKind(code, tempC) {
  const kind = weatherKind(code);
  if (kind === 'rain' || kind === 'showers' || kind === 'drizzle' || kind === 'storm') return 'rain';
  if (kind === 'fog') return 'fog';
  if (typeof tempC === 'number' && tempC >= 36) return 'hot';
  if (typeof tempC === 'number' && tempC <= 10) return 'cold';
  if (kind === 'clear' || kind === 'mainlyClear') return 'clear';
  return 'ok';
}

/**
 * @returns {{ temperature, weatherCode, humidity, wind, kind, tipKind } | { error }}
 */
export async function fetchCurrentWeather(lat, lng, { signal } = {}) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { data: null, error: 'Invalid coordinates' };
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m');
  url.searchParams.set('timezone', 'auto');

  try {
    const res = await fetch(url.toString(), { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return { data: null, error: 'Weather unavailable' };
    const json = await res.json();
    const cur = json?.current;
    if (!cur) return { data: null, error: 'Weather unavailable' };
    const temperature = Number(cur.temperature_2m);
    const weatherCode = Number(cur.weather_code);
    return {
      data: {
        temperature,
        weatherCode,
        humidity: Number(cur.relative_humidity_2m),
        wind: Number(cur.wind_speed_10m),
        kind: weatherKind(weatherCode),
        tipKind: pickupTipKind(weatherCode, temperature),
      },
      error: null,
    };
  } catch (err) {
    if (err?.name === 'AbortError') return { data: null, error: null };
    return { data: null, error: 'Weather unavailable' };
  }
}

/** Best-effort place label via Nominatim reverse geocode. */
export async function reversePlaceLabel(lat, lng, { signal } = {}) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('zoom', '10');
    const res = await fetch(url.toString(), {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const a = json?.address || {};
    return a.city || a.town || a.village || a.county || a.state || null;
  } catch {
    return null;
  }
}
