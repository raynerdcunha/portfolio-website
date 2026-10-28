/* Live LeetCode stat for the home page.
   Asks /api/leetcode for fresh numbers and updates the total, the easy/medium/hard pills and the ring.
   If anything fails, the numbers already written in index.html stay. */
(function () {
  var el = function (id) { return document.getElementById(id); };
  var total = el('lc-solved');
  if (!total || !window.fetch) return;

  var LEVELS = ['easy', 'medium', 'hard'];
  var R = 42, C = 2 * Math.PI * R, GAP = 4, MIN = C * 0.035;   // ring geometry (matches the SVG in index.html)

  function drawRing(d) {
    var vals = LEVELS.map(function (k) { return d[k]; });
    var sum = vals.reduce(function (a, b) { return a + b; }, 0);
    if (!sum) return;
    var lens = vals.map(function (v) { return v > 0 ? Math.max(v / sum * C, MIN) : 0; });
    var tot = lens.reduce(function (a, b) { return a + b; }, 0);
    var off = 0;
    LEVELS.forEach(function (k, i) {
      var arc = el('lc-arc-' + k);
      var len = lens[i] * C / tot;
      if (arc) {
        var dash = len > 0 ? Math.max(len - GAP, 0.1) : 0;
        arc.setAttribute('stroke-dasharray', dash.toFixed(2) + ' ' + (C - dash).toFixed(2));
        arc.setAttribute('stroke-dashoffset', (-off).toFixed(2));
      }
      off += len;
    });
  }

  fetch('/api/leetcode', { headers: { 'Accept': 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (!d || !isFinite(d.solved) || !isFinite(d.easy) || !isFinite(d.medium) || !isFinite(d.hard)) return;
      total.setAttribute('data-count', d.solved);   // used if the count-up hasn't run yet
      total.textContent = d.solved;
      LEVELS.forEach(function (k) { if (el('lc-' + k)) el('lc-' + k).textContent = d[k]; });
      drawRing(d);
      var link = total.closest('a');
      if (link) link.setAttribute('aria-label', 'LeetCode profile: ' + d.solved + ' problems solved. Opens in a new tab.');
    })
    .catch(function () { /* keep the numbers already on the page */ });
})();