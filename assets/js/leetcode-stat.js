/* Live LeetCode stat for the home page.
   Asks /api/leetcode for fresh numbers; if anything fails, the hard-coded text in index.html stays. */
(function () {
  var num = document.getElementById('lc-solved');
  var label = document.getElementById('lc-label');
  if (!num || !window.fetch) return;

  fetch('/api/leetcode', { headers: { 'Accept': 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (!d || !isFinite(d.solved)) return;
      num.setAttribute('data-count', d.solved);   // used if the count-up hasn't run yet
      num.textContent = d.solved;
      if (label && isFinite(d.easy) && isFinite(d.medium) && isFinite(d.hard)) {
        label.textContent = 'LeetCode problems solved — ' + d.easy + ' easy, ' + d.medium + ' medium, ' + d.hard + ' hard';
      }
    })
    .catch(function () { /* keep the static fallback */ });
})();