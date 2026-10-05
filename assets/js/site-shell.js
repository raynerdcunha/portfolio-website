/*
 * site-shell.js — shared by every page.
 * First-visit loader, smooth page-to-page transitions, cursor glow on glass cards,
 * scroll reveal, number count-up and the typed role line on the home page.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = false; // effects always run (site design choice)

  /* ---------- Loader: once per session ---------- */
  if (root.classList.contains('is-loading')) {
    try { sessionStorage.setItem('rd-loader-seen', '1'); } catch (e) {}
    setTimeout(function () { root.classList.remove('is-loading'); }, 800);
  }

  /* ---------- Page transitions between internal pages ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || reduceMotion || window.gsap) return; // motion.js handles the wipe when GSAP is loaded
    if (a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || /\.pdf$/i.test(url.pathname)) return;
    e.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(function () { location.href = a.href; }, 170);
  });
  // Coming back with the browser's Back button: make sure the page isn't left faded out.
  window.addEventListener('pageshow', function () { document.body.classList.remove('is-leaving'); });

  /* ---------- Cursor-follow glow on glass cards ---------- */
  document.addEventListener('pointermove', function (e) {
    var card = e.target.closest && e.target.closest('.glass--glow');
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  /* ---------- Has this page already animated in this tab? (motion.js sets the flag) ---------- */
  var seenPage = false;
  try { seenPage = sessionStorage.getItem('rd-seen:' + (location.pathname.replace(/(index)?\.html$/, '').replace(/(.)\/$/, '$1') || '/')) === '1'; } catch (e) {}
  if (seenPage) root.classList.add('is-seen');

  /* ---------- Count-up numbers ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion || seenPage || isNaN(target)) { el.textContent = target + suffix; return; }
    var start = null, dur = 1200;
    function tick(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Scroll reveal (+ triggers count-ups and data-run visuals) ---------- */
  // With GSAP loaded, motion.js animates .reveal elements; here we only handle counters and run-once visuals.
  var revealEls = document.querySelectorAll(window.gsap ? '[data-count], [data-run]' : '.reveal, [data-count], [data-run]');
  function show(el) {
    el.classList.add('is-visible');
    if (el.hasAttribute('data-count')) countUp(el);
    if (el.hasAttribute('data-run')) el.classList.add('is-run');
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(show);
  }

  /* ---------- Typed role line (home) ---------- */
  var typed = document.querySelector('[data-typed]');
  if (typed) {
    var words = typed.getAttribute('data-typed').split('|');
    if (reduceMotion) { typed.textContent = words[0]; }
    else {
      var w = 0, i = words[0].length, deleting = false;
      typed.textContent = words[0];
      var loop = function () {
        var word = words[w];
        if (!deleting && i === word.length) { deleting = true; return setTimeout(loop, 1800); }
        if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; return setTimeout(loop, 250); }
        i += deleting ? -1 : 1;
        typed.textContent = words[w].slice(0, i);
        setTimeout(loop, deleting ? 28 : 55);
      };
      setTimeout(loop, 1800);
    }
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
