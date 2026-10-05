/*
 * space-network.js — home page background.
 * A slow-drifting constellation of nodes that link up when close and lean
 * toward the cursor. Pauses when the tab is hidden; static for reduced motion.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('space-network');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduceMotion = false; // effects always run (site design choice)
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, nodes = [], mouse = { x: -9999, y: -9999 };
  var COLORS = ['34,227,255', '167,139,250', '255,95,210'];
  var LINK = 140;

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.round(Math.min(55, (W * H) / 24000));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
        c: COLORS[i % 3]
      });
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!reduceMotion) {
        var mdx = mouse.x - n.x, mdy = mouse.y - n.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 200) { n.vx += mdx / md * 0.01; n.vy += mdy / md * 0.01; }
        n.vx *= 0.995; n.vy *= 0.995;
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }
      for (var j = i + 1; j < nodes.length; j++) {
        var m = nodes[j], dx = n.x - m.x, dy = n.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK) {
          ctx.strokeStyle = 'rgba(' + n.c + ',' + (0.18 * (1 - d / LINK)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(' + n.c + ',0.85)';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduceMotion && !document.hidden) requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('resize', function () { resize(); if (reduceMotion) frame(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !reduceMotion) requestAnimationFrame(frame); });

  resize();
  frame();
})();
