const fs = require('fs');
const path = require('path');

let page;

function load() {
  if (page !== undefined) return page;
  try {
    page = fs.readFileSync(path.join(process.cwd(), '404.html'), 'utf8');
  } catch (e) {
    page = null;
  }
  return page;
}

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.setHeader('X-Robots-Tag', 'noindex');
  const html = load();
  if (!html) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(404).send(html);
};
