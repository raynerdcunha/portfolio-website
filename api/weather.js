// Vercel serverless function: GET /api/weather?me=1  or  GET /api/weather?place=Toronto
// The visitor's browser only ever talks to this site. This function asks Open-Meteo on its behalf,
// so Open-Meteo sees Vercel's servers, never the visitor's IP address. Answers are cached at the CDN,
// so repeat visitors for the same place are served without contacting Open-Meteo at all.

const ME = { name: 'Edmonton', country: 'CA', lat: 53.5461, lon: -113.4938 };
const PLACE_RE = /^[\p{L}][\p{L} .'’-]{0,59}$/u;

async function getJSON(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'portfolio-weather-proxy' } });
  if (!r.ok) throw new Error('upstream ' + r.status);
  return r.json();
}

async function current(lat, lon) {
  const d = await getJSON('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
    '&current=temperature_2m,weather_code,is_day&timezone=auto');
  const c = d && d.current;
  if (!c || typeof c.temperature_2m !== 'number') throw new Error('bad shape');
  return { temp: c.temperature_2m, code: c.weather_code, isDay: c.is_day };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const q = req.query || {};
    let place = ME;
    if (!q.me) {
      const name = typeof q.place === 'string' ? q.place.trim() : '';
      if (!PLACE_RE.test(name)) return res.status(400).json({ error: 'Invalid place' });
      const g = await getJSON('https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=' + encodeURIComponent(name));
      const hit = g && g.results && g.results[0];
      if (!hit) return res.status(404).json({ error: 'Place not found' });
      place = { name: hit.name, country: hit.country_code || '', lat: hit.latitude, lon: hit.longitude };
    }
    const w = await current(place.lat, place.lon);
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    return res.status(200).json({ name: place.name, country: place.country, temp: w.temp, code: w.code, isDay: w.isDay });
  } catch (e) {
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(502).json({ error: 'Weather unavailable' });
  }
};
