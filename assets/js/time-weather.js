/*
 * time-weather.js — home page "My side / Your side" panel.
 * Shows Rayner's local time + weather (Edmonton) next to the visitor's.
 * The visitor's city is guessed from their browser time zone (e.g. America/Toronto -> Toronto),
 * so no location permission prompt is ever shown. Weather comes from Open-Meteo (free, no API key).
 * If anything fails, the clocks still work and weather shows a dash.
 */
(function () {
  'use strict';

  var panel = document.querySelector('.tz-panel');
  if (!panel) return;

  var ME = { tz: 'America/Edmonton', city: 'Edmonton, AB', lat: 53.5461, lon: -113.4938 };
  var visitorTz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || ME.tz;
  var US_TZ = /^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana|Kentucky|North_Dakota|Juneau|Sitka|Nome|Adak|Menominee)|^Pacific\/Honolulu/;

  var el = function (side, part) { return panel.querySelector('[data-side="' + side + '"] [data-part="' + part + '"]'); };

  /* ---------- Clocks ---------- */
  function fmtTime(tz) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(new Date());
  }
  function fmtDay(tz) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  }
  function offsetMinutes(tz) {
    var now = new Date();
    var local = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    var utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    return Math.round((local - utc) / 60000);
  }
  function tick() {
    el('me', 'time').textContent = fmtTime(ME.tz);
    el('me', 'day').textContent = fmtDay(ME.tz);
    el('you', 'time').textContent = fmtTime(visitorTz);
    el('you', 'day').textContent = fmtDay(visitorTz);
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Time difference ---------- */
  var diff = offsetMinutes(visitorTz) - offsetMinutes(ME.tz);
  var gap = panel.querySelector('[data-part="gap"]');
  if (diff === 0) gap.textContent = 'Same time zone as me';
  else {
    var h = Math.abs(diff) / 60;
    var hs = (h % 1 === 0 ? h : h.toFixed(1)) + (h === 1 ? ' hour' : ' hours');
    gap.textContent = 'You\'re ' + hs + (diff > 0 ? ' ahead' : ' behind');
  }

  /* ---------- Visitor city from time zone ---------- */
  var tzCity = visitorTz.indexOf('/') > -1 ? visitorTz.split('/').pop().replace(/_/g, ' ') : null;
  if (/^(UTC|GMT|Etc)/.test(visitorTz)) tzCity = null;
  el('you', 'city').textContent = tzCity || 'Your area';

  /* ---------- Weather ---------- */
  var CODES = {
    0: ['☀️', 'Clear'], 1: ['🌤️', 'Mostly clear'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Overcast'],
    45: ['🌫️', 'Fog'], 48: ['🌫️', 'Fog'],
    51: ['🌦️', 'Drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌦️', 'Drizzle'], 56: ['🌧️', 'Freezing drizzle'], 57: ['🌧️', 'Freezing drizzle'],
    61: ['🌧️', 'Light rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'], 66: ['🌧️', 'Freezing rain'], 67: ['🌧️', 'Freezing rain'],
    71: ['🌨️', 'Light snow'], 73: ['🌨️', 'Snow'], 75: ['❄️', 'Heavy snow'], 77: ['🌨️', 'Snow grains'],
    80: ['🌦️', 'Showers'], 81: ['🌦️', 'Showers'], 82: ['⛈️', 'Heavy showers'], 85: ['🌨️', 'Snow showers'], 86: ['🌨️', 'Snow showers'],
    95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Thunderstorm'], 99: ['⛈️', 'Thunderstorm']
  };

  function showWeather(side, data, useF) {
    var cur = data && data.current;
    if (!cur || typeof cur.temperature_2m !== 'number') return showNoWeather(side);
    var c = cur.temperature_2m;
    var info = CODES[cur.weather_code] || ['🌡️', 'Current conditions'];
    var icon = info[0];
    if (cur.is_day === 0 && (cur.weather_code === 0 || cur.weather_code === 1)) icon = '🌙';
    var temp = useF ? Math.round(c * 9 / 5 + 32) + '°F' : Math.round(c) + '°C';
    el(side, 'icon').textContent = icon;
    el(side, 'temp').textContent = temp;
    el(side, 'cond').textContent = info[1];
  }
  function showNoWeather(side) {
    el(side, 'icon').textContent = '·';
    el(side, 'temp').textContent = '—';
    el(side, 'cond').textContent = 'Weather unavailable';
  }
  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function forecast(lat, lon) {
    return getJSON('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,weather_code,is_day&timezone=auto');
  }

  forecast(ME.lat, ME.lon).then(function (d) { showWeather('me', d, false); }).catch(function () { showNoWeather('me'); });

  if (visitorTz === ME.tz) {
    el('you', 'city').textContent = 'Edmonton area';
    forecast(ME.lat, ME.lon).then(function (d) { showWeather('you', d, false); }).catch(function () { showNoWeather('you'); });
  } else if (tzCity) {
    getJSON('https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=' + encodeURIComponent(tzCity))
      .then(function (g) {
        var place = g && g.results && g.results[0];
        if (!place) throw new Error('no place');
        el('you', 'city').textContent = place.name + (place.country_code ? ', ' + place.country_code : '');
        return forecast(place.latitude, place.longitude);
      })
      .then(function (d) { showWeather('you', d, US_TZ.test(visitorTz)); })
      .catch(function () { showNoWeather('you'); });
  } else {
    showNoWeather('you');
  }
})();
