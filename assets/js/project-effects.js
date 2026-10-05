/*
 * project-effects.js — projects page only.
 * Category filters, the live FlameoShell terminal, and the Omakase choice cycler.
 */
(function () {
  'use strict';

  var reduceMotion = false; // effects always run (site design choice)

  /* ---------- Filters ---------- */
  var filters = document.querySelectorAll('.filter');
  var cards = document.querySelectorAll('.proj');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      cards.forEach(function (c) {
        var tags = (c.getAttribute('data-tags') || '').split(' ');
        c.classList.toggle('is-hidden', f !== 'all' && tags.indexOf(f) === -1);
      });
    });
  });

  /* ---------- FlameoShell terminal (types real shell features in a loop) ---------- */
  var term = document.getElementById('flameo-term');
  if (term) {
    var script = [
      { cmd: 'sleep 30 &', out: '[1] 4821' },
      { cmd: 'ls -l | grep .c > sources.txt', out: '' },
      { cmd: 'cat < sources.txt | wc -l', out: '12' },
      { cmd: 'jobs', out: '[1]+ Running        sleep 30 &', ok: true },
      { cmd: 'fg %1', out: 'sleep 30\n^Z\n[1]+ Stopped        sleep 30', ok: true }
    ];
    var lines = [];

    function escapeHtml(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
    function draw(current) {
      var html = lines.slice(-7).join('\n');
      term.innerHTML = (html ? html + '\n' : '') + '<span class="p">flameo$</span> ' + escapeHtml(current) + '<span class="term__cursor"></span>';
    }

    if (reduceMotion) {
      script.forEach(function (s) {
        lines.push('<span class="p">flameo$</span> ' + escapeHtml(s.cmd));
        if (s.out) lines.push('<span class="' + (s.ok ? 'ok' : 'o') + '">' + escapeHtml(s.out) + '</span>');
      });
      draw('');
    } else {
      var step = 0;
      var typeCmd = function () {
        var s = script[step], i = 0;
        var typeChar = function () {
          draw(s.cmd.slice(0, i));
          if (i++ < s.cmd.length) return setTimeout(typeChar, 45 + Math.random() * 40);
          setTimeout(function () {
            lines.push('<span class="p">flameo$</span> ' + escapeHtml(s.cmd));
            if (s.out) lines.push('<span class="' + (s.ok ? 'ok' : 'o') + '">' + escapeHtml(s.out) + '</span>');
            step = (step + 1) % script.length;
            if (step === 0) lines.push('<span class="o">— session restarted —</span>');
            draw('');
            setTimeout(typeCmd, 900);
          }, 350);
        };
        typeChar();
      };
      draw('');
      setTimeout(typeCmd, 600);
    }
  }

  /* ---------- Omakase choice cycler ---------- */
  var choice = document.querySelectorAll('.choice span');
  if (choice.length && !reduceMotion) {
    var k = 0;
    setInterval(function () {
      choice.forEach(function (c, idx) { c.classList.toggle('is-on', idx === k); });
      k = (k + 1) % choice.length;
    }, 1100);
  }
})();
