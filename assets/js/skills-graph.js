/*
 * skills-graph.js
 * Live, Obsidian-style knowledge graph for the Skills page (no libraries).
 * - Nodes sit on a small physics simulation and float gently.
 * - Drag any skill (or category hub): connected nodes follow like springs, then it settles.
 * - Hover / tap a node to light up its connections and see where the skill was used.
 * - Click a category in the side panel to hide/show it (graph only).
 * Also builds the List view and the legend from window.RD_SKILLS.
 */
(function () {
  'use strict';

  var data = window.RD_SKILLS;
  var svg = document.getElementById('skills-graph');
  var wrap = document.querySelector('.skills');
  if (!data || !svg || !wrap) return;

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var W = 820, H = 600;
  var info = document.querySelector('.skill-info');
  var clusterById = {}, skillById = {};
  data.clusters.forEach(function (c) { clusterById[c.id] = c; });
  data.skills.forEach(function (s) { skillById[s.id] = s; });

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVG_NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  // Deterministic random so the starting layout is identical on every visit.
  function seeded(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Graph model ---------- */
  var nodes = [], byId = {}, edges = [], neighbours = {}, hidden = {};

  function build() {
    var rand = seeded(42);
    nodes = []; byId = {}; edges = []; neighbours = {};
    data.clusters.forEach(function (c, i) {
      var angle = (-90 + i * 72) * Math.PI / 180;
      var tx = W / 2 + Math.cos(angle) * 270, ty = H / 2 + 15 + Math.sin(angle) * 180;
      var hub = { id: 'hub-' + c.id, hub: true, cluster: c.id, label: c.label, r: 28, x: tx, y: ty, hx: tx, hy: ty, vx: 0, vy: 0 };
      nodes.push(hub); byId[hub.id] = hub;
    });
    data.skills.forEach(function (s) {
      var hub = byId['hub-' + s.cluster];
      var n = {
        id: s.id, skill: s, cluster: s.cluster, label: s.short || s.label,
        r: 7 + 3.2 * s.uses.length,
        x: hub.x + (rand() - 0.5) * 140, y: hub.y + (rand() - 0.5) * 140, vx: 0, vy: 0,
        phase: rand() * Math.PI * 2
      };
      nodes.push(n); byId[n.id] = n;
    });
    data.skills.forEach(function (s) { edges.push({ a: byId['hub-' + s.cluster], b: byId[s.id], len: 82, k: 0.05, cross: false }); });
    data.links.forEach(function (l) {
      if (byId[l[0]] && byId[l[1]]) edges.push({ a: byId[l[0]], b: byId[l[1]], len: 170, k: 0.004, cross: true });
    });
    edges.forEach(function (e) {
      (neighbours[e.a.id] = neighbours[e.a.id] || []).push(e.b.id);
      (neighbours[e.b.id] = neighbours[e.b.id] || []).push(e.a.id);
    });
    // Settle before first paint so it opens in a tidy shape.
    for (var i = 0; i < 300; i++) step(1 - i / 300);
  }

  /* ---------- Physics ---------- */
  var alpha = 1;
  function visible(n) { return !hidden[n.cluster]; }

  function step(a) {
    var i, j, n, m, dx, dy, d2, d, f, fx, fy;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; if (!visible(n)) continue;
      for (j = i + 1; j < nodes.length; j++) {
        m = nodes[j]; if (!visible(m)) continue;
        dx = m.x - n.x; dy = m.y - n.y; d2 = dx * dx + dy * dy || 0.01; d = Math.sqrt(d2);
        f = 1900 / d2;
        var minD = n.r + m.r + ((n.hub || m.hub) ? 44 : 36);
        if (d < minD) f += (minD - d) * 0.3;
        fx = dx / d * f; fy = dy / d * f;
        n.vx -= fx; n.vy -= fy; m.vx += fx; m.vy += fy;
      }
    }
    edges.forEach(function (e) {
      if (!visible(e.a) || !visible(e.b)) return;
      var ex = e.b.x - e.a.x, ey = e.b.y - e.a.y, ed = Math.sqrt(ex * ex + ey * ey) || 0.01;
      var ef = (ed - e.len) * e.k;
      e.a.vx += ex / ed * ef; e.a.vy += ey / ed * ef; e.b.vx -= ex / ed * ef; e.b.vy -= ey / ed * ef;
    });
    nodes.forEach(function (n) {
      if (n.hub) { n.vx += (n.hx - n.x) * 0.03; n.vy += (n.hy - n.y) * 0.03; }
      n.vx += (W / 2 - n.x) * 0.0008; n.vy += (H / 2 - n.y) * 0.0008;
      if (n === dragNode) { n.vx = 0; n.vy = 0; return; }
      n.vx *= 0.6; n.vy *= 0.6;
      n.x += n.vx * a; n.y += n.vy * a;
      n.x = Math.max(36, Math.min(W - 36, n.x));
      n.y = Math.max(30, Math.min(H - 36, n.y));
    });
  }

  /* ---------- Rendering ---------- */
  var gEdges, gNodes, lineEls = [], nodeEls = {};
  var pinned = null;

  function render() {
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = el('defs', {}, svg);
    var filt = el('filter', { id: 'node-glow', x: '-80%', y: '-80%', width: '260%', height: '260%' }, defs);
    el('feGaussianBlur', { stdDeviation: '5', result: 'blur' }, filt);
    var merge = el('feMerge', {}, filt);
    el('feMergeNode', { 'in': 'blur' }, merge);
    el('feMergeNode', { 'in': 'SourceGraphic' }, merge);

    gEdges = el('g', { 'class': 'g-edges' }, svg);
    gNodes = el('g', { 'class': 'g-nodes' }, svg);
    lineEls = []; nodeEls = {};

    edges.forEach(function (e) {
      var line = el('line', { 'class': 'g-edge' + (e.cross ? ' g-edge--cross' : ''), 'data-a': e.a.id, 'data-b': e.b.id, 'aria-hidden': 'true' }, gEdges);
      lineEls.push({ el: line, e: e });
    });

    nodes.forEach(function (n) {
      var color = 'var(--c-' + n.cluster + ')';
      var g = el('g', { 'class': 'g-node' + (n.hub ? ' g-node--hub' : ''), 'data-id': n.id }, gNodes);
      var circle = el('circle', { r: n.r }, g);
      circle.style.fill = color;
      if (n.hub) circle.style.stroke = color; else circle.setAttribute('filter', 'url(#node-glow)');
      var text = el('text', { 'text-anchor': 'middle', y: n.hub ? 4 : (n.r + 14) }, g);
      text.textContent = n.label;
      nodeEls[n.id] = g;

      g.addEventListener('pointerdown', function (e) { startDrag(e, n); });
      if (!n.hub) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', n.skill.label + ', ' + clusterById[n.cluster].label + '. Used in: ' + n.skill.uses.join(', '));
        g.addEventListener('mouseenter', function () { if (!pinned && !dragNode) focusNode(n.id); });
        g.addEventListener('mouseleave', function () { if (!pinned && !dragNode) clearFocus(); });
        g.addEventListener('focus', function () { focusNode(n.id); });
        g.addEventListener('blur', function () { if (!pinned) clearFocus(); });
        g.addEventListener('click', function (e) {
          e.stopPropagation();
          if (moved) return;
          if (pinned === n.id) { pinned = null; clearFocus(); } else { pinned = n.id; focusNode(n.id); }
        });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.dispatchEvent(new MouseEvent('click')); }
        });
      }
    });
    applyHidden();
    draw(0);
    if (pinned) focusNode(pinned);
    document.dispatchEvent(new CustomEvent('rd:graph-rendered'));
  }

  function draw(t) {
    // gentle float on top of the physics position
    var pos = {};
    nodes.forEach(function (n) {
      var fx = n.hub || n === dragNode ? 0 : Math.sin(t / 1400 + n.phase) * 2.5;
      var fy = n.hub || n === dragNode ? 0 : Math.cos(t / 1700 + n.phase) * 2.5;
      pos[n.id] = { x: n.x + fx, y: n.y + fy };
      nodeEls[n.id].setAttribute('transform', 'translate(' + pos[n.id].x.toFixed(1) + ' ' + pos[n.id].y.toFixed(1) + ')');
    });
    lineEls.forEach(function (o) {
      var a = pos[o.e.a.id], b = pos[o.e.b.id];
      o.el.setAttribute('x1', a.x.toFixed(1)); o.el.setAttribute('y1', a.y.toFixed(1));
      o.el.setAttribute('x2', b.x.toFixed(1)); o.el.setAttribute('y2', b.y.toFixed(1));
    });
  }

  function applyHidden() {
    nodes.forEach(function (n) { if (nodeEls[n.id]) nodeEls[n.id].style.display = hidden[n.cluster] ? 'none' : ''; });
    lineEls.forEach(function (o) { o.el.style.display = (hidden[o.e.a.cluster] || hidden[o.e.b.cluster]) ? 'none' : ''; });
    reheat(0.5);
  }

  /* ---------- Animation loop (only while the graph is on screen) ---------- */
  var running = false, onScreen = true;
  function loop(t) {
    if (alpha > 0.002 || dragNode) { step(Math.max(alpha, dragNode ? 0.3 : 0)); alpha *= 0.985; }
    draw(t);
    if (onScreen && wrap.getAttribute('data-view') === 'graph') requestAnimationFrame(loop);
    else running = false;
  }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }
  function reheat(a) { alpha = Math.max(alpha, a); start(); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen) start(); }).observe(svg);
  }

  /* ---------- Dragging nodes ---------- */
  var dragNode = null, moved = false, downAt = null;
  function toSvg(e) {
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function startDrag(e, n) {
    e.preventDefault();
    dragNode = n; moved = false; downAt = { x: e.clientX, y: e.clientY };
    svg.classList.add('is-dragging');
    if (svg.setPointerCapture) { try { svg.setPointerCapture(e.pointerId); } catch (err) {} }
    reheat(0.4);
  }
  svg.addEventListener('pointermove', function (e) {
    if (!dragNode) return;
    if (!moved && Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y) > 4) moved = true;
    var p = toSvg(e);
    dragNode.x = Math.max(36, Math.min(W - 36, p.x));
    dragNode.y = Math.max(30, Math.min(H - 36, p.y));
    if (dragNode.hub) { dragNode.hx = dragNode.x; dragNode.hy = dragNode.y; }
    if (moved) focusNode(dragNode.hub ? null : dragNode.id);
  });
  function endDrag() {
    if (!dragNode) return;
    dragNode = null;
    svg.classList.remove('is-dragging');
    reheat(0.3);
    if (moved && !pinned) clearFocus();
    setTimeout(function () { moved = false; }, 0);
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('click', function () { if (moved) return; pinned = null; clearFocus(); });

  var resetBtn = document.querySelector('.graph-reset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    pinned = null; clearFocus();
    build(); render(); reheat(0.2);
  });

  /* ---------- Focus / info panel ---------- */
  function focusNode(id) {
    if (!id) return;
    var lit = {}; lit[id] = true;
    (neighbours[id] || []).forEach(function (n) { lit[n] = true; });
    svg.classList.add('is-focused');
    Object.keys(nodeEls).forEach(function (k) { nodeEls[k].classList.toggle('is-lit', !!lit[k]); });
    lineEls.forEach(function (o) { o.el.classList.toggle('is-lit', o.e.a.id === id || o.e.b.id === id); });
    var s = skillById[id];
    if (s && info) {
      var c = clusterById[s.cluster];
      info.innerHTML = '';
      var name = document.createElement('p'); name.className = 'skill-info__name'; name.textContent = s.label;
      var grp = document.createElement('p'); grp.className = 'skill-info__group'; grp.style.color = 'var(--c-' + s.cluster + ')';
      grp.textContent = c.label + ' · used in ' + s.uses.length + (s.uses.length === 1 ? ' place' : ' places');
      var uses = document.createElement('p'); uses.className = 'skill-info__uses'; uses.textContent = s.uses.join(' · ');
      info.appendChild(name); info.appendChild(grp); info.appendChild(uses);
    }
  }
  function clearFocus() {
    svg.classList.remove('is-focused');
    svg.querySelectorAll('.is-lit').forEach(function (n) { n.classList.remove('is-lit'); });
    if (info) info.innerHTML = '<p class="skill-info__hint">&gt; hover a node to inspect · drag to move it</p>';
  }

  /* ---------- List view ---------- */
  var list = document.getElementById('skills-list');
  if (list) {
    data.clusters.forEach(function (c) {
      var box = document.createElement('div');
      box.className = 'list-group';
      box.setAttribute('data-cluster', c.id);
      var h = document.createElement('h4');
      h.innerHTML = '<span class="swatch" style="background: var(--c-' + c.id + ')"></span>';
      h.appendChild(document.createTextNode(c.label));
      var ul = document.createElement('ul');
      data.skills.filter(function (s) { return s.cluster === c.id; })
        .sort(function (a, b) { return b.uses.length - a.uses.length; })
        .forEach(function (s) {
          var li = document.createElement('li');
          li.textContent = s.label;
          var sub = document.createElement('span'); sub.textContent = s.uses.join(' · ');
          li.appendChild(sub); ul.appendChild(li);
        });
      box.appendChild(h); box.appendChild(ul); list.appendChild(box);
    });
  }

  /* ---------- Legend: click a category to hide/show it in the graph ---------- */
  var legend = document.getElementById('skills-legend');
  if (legend) {
    data.clusters.forEach(function (c) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'legend__toggle';
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', 'Hide ' + c.label);
      btn.innerHTML = '<span class="swatch" style="background: var(--c-' + c.id + ')"></span>';
      btn.appendChild(document.createTextNode(c.label));
      btn.addEventListener('click', function () {
        hidden[c.id] = !hidden[c.id];
        btn.setAttribute('aria-pressed', String(!hidden[c.id]));
        btn.setAttribute('aria-label', (hidden[c.id] ? 'Show ' : 'Hide ') + c.label);
        applyHidden();
        // the same toggle filters the List view
        var group = list && list.querySelector('.list-group[data-cluster="' + c.id + '"]');
        if (group) group.classList.toggle('is-hidden', !!hidden[c.id]);
      });
      li.appendChild(btn); legend.appendChild(li);
    });
    var note = document.createElement('li');
    note.className = 'legend__note';
    note.textContent = 'Click a category to hide it (graph and list) · drag nodes around · bigger node = used in more places';
    legend.appendChild(note);
  }

  /* ---------- Graph / List switch ---------- */
  var buttons = document.querySelectorAll('.view-switch__btn');
  function setView(view) {
    wrap.setAttribute('data-view', view);
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view)); });
    if (view === 'graph') { render(); start(); }
  }
  buttons.forEach(function (b) { b.addEventListener('click', function () { setView(b.getAttribute('data-view')); }); });

  build();
  alpha = 0;
  setView('graph');
})();
