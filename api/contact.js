const LIMITS = { name: 100, email: 200, subject: 150, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const seen = new Map();

function tooMany(ip) {
  const now = Date.now();
  for (const [key, list] of seen) {
    const fresh = list.filter((t) => now - t < WINDOW_MS);
    if (fresh.length) seen.set(key, fresh);
    else seen.delete(key);
  }
  const list = seen.get(ip) || [];
  if (list.length >= MAX_PER_WINDOW) return true;
  list.push(now);
  seen.set(ip, list);
  return false;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  return String(req.headers['x-real-ip'] || 'unknown');
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch (e) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  if (!sameOrigin(req)) return res.status(403).json({ ok: false, error: 'forbidden' });

  const target = process.env.CONTACT_SCRIPT_URL;
  if (!target) return res.status(503).json({ ok: false, error: 'unavailable' });

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (typeof body._gotcha === 'string' && body._gotcha) return res.status(200).json({ ok: true });

  const clean = {};
  for (const key of Object.keys(LIMITS)) {
    const value = body[key];
    if (typeof value !== 'string') return res.status(400).json({ ok: false, error: 'missing_fields' });
    clean[key] = value.trim().slice(0, LIMITS[key]);
    if (!clean[key]) return res.status(400).json({ ok: false, error: 'missing_fields' });
  }
  if (!EMAIL_RE.test(clean.email)) return res.status(400).json({ ok: false, error: 'bad_email' });

  if (tooMany(clientIp(req))) return res.status(429).json({ ok: false, error: 'too_many' });

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      body: new URLSearchParams(clean),
      signal: AbortSignal.timeout(9000)
    });
    const data = await upstream.json();
    const ok = Boolean(data && data.ok === true);
    const error = data && data.error ? String(data.error) : undefined;
    const limited = error === 'slow_down' || error === 'daily_limit';
    return res.status(ok ? 200 : limited ? 429 : 502).json({ ok, error });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'unavailable' });
  }
};
