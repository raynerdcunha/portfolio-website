/*
 * motion.js — the animation layer (needs GSAP + ScrollTrigger from /assets/vendor).
 * Taskbar indicator + scroll progress, page wipe transitions, intro text reveal,
 * staggered scroll reveals, magnetic buttons, 3D card tilt,
 * timeline draw and skills-graph pop-in. Everything degrades to static content
 * if GSAP fails to load or the visitor prefers reduced motion.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false; // effects always run (site design choice)
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ---------- Taskbar sliding indicator (works even without GSAP) ---------- */
  var nav = $('.taskbar__nav');
  if (nav) {
    var ind = $('.taskbar__indicator', nav);
    var links = $$('.taskbar__link', nav);
    var current = links.filter(function (l) { return l.getAttribute('aria-current') === 'page'; })[0];
    var moveTo = function (link) {
      if (!link) { ind.style.opacity = '0'; return; }
      ind.style.opacity = '1';
      ind.style.width = link.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    };
    links.forEach(function (l) { l.addEventListener('mouseenter', function () { moveTo(l); }); });
    nav.addEventListener('mouseleave', function () { moveTo(current); });
    moveTo(current);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveTo(current); });
    window.addEventListener('resize', function () { moveTo(current); });
  }

  if (!window.gsap) { root.classList.remove('is-wiping'); return; }
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  root.classList.add('has-gsap');

  /* ---------- Scrolled taskbar + progress bar ---------- */
  var bar = $('.progress span');
  var onScroll = function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    root.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduce) {
    gsap.set('.reveal', { opacity: 1, y: 0 });
    root.classList.remove('is-wiping');
    return;
  }

  /* ---------- Play entrance animations once per page per tab session ---------- */
  var seenKey = 'rd-seen:' + (location.pathname.replace(/(index)?\.html$/, '').replace(/(.)\/$/, '$1') || '/');
  var seenPage = false;
  try { seenPage = sessionStorage.getItem(seenKey) === '1'; sessionStorage.setItem(seenKey, '1'); } catch (e) {}
  if (seenPage) root.classList.add('is-seen');

  /* ---------- Page wipe: reveal on arrival, cover on leave ---------- */
  var wipe = $('.wipe');
  var arrivedByWipe = root.classList.contains('is-wiping');
  if (wipe && arrivedByWipe) {
    gsap.fromTo(wipe, { xPercent: 0, autoAlpha: 1 }, {
      xPercent: 101, duration: 0.7, ease: 'power4.inOut', delay: 0.05,
      onComplete: function () { root.classList.remove('is-wiping'); gsap.set(wipe, { autoAlpha: 0 }); }
    });
    try { sessionStorage.removeItem('rd-wipe'); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || !wipe) return;
    if (a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || /\.pdf$/i.test(url.pathname)) return;
    if (url.pathname === location.pathname) return;
    e.preventDefault();
    gsap.fromTo(wipe, { xPercent: -101, autoAlpha: 1 }, {
      xPercent: 0, duration: 0.5, ease: 'power4.inOut',
      onComplete: function () {
        try { sessionStorage.setItem('rd-wipe', '1'); } catch (err) {}
        location.href = a.href;
      }
    });
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && wipe) gsap.set(wipe, { autoAlpha: 0 }); });

  /* ---------- Decode effect: random glyphs that lock into the real text ---------- */
  var GLYPHS_UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/';
  var GLYPHS_LOW = 'abcdefghijklmnopqrstuvwxyz0123456789#$%&*<>/';
  function decode(el, opts) {
    opts = opts || {};
    var final = el.getAttribute('data-final') || el.textContent;
    el.setAttribute('data-final', final);
    el.setAttribute('aria-label', final);
    var perChar = opts.perChar || 3;        // frames each letter spends scrambling before it locks
    var lead = opts.lead || 6;              // frames of pure noise before the first letter locks
    var frame = 0;
    var randFor = function (c) {
      if (c === ' ' || c === '·' || c === "'") return c;
      var pool = c === c.toLowerCase() && c !== c.toUpperCase() ? GLYPHS_LOW : GLYPHS_UP;
      return pool[Math.floor(Math.random() * pool.length)];
    };
    var tick = function () {
      var locked = Math.max(0, Math.floor((frame - lead) / perChar));
      var out = final.slice(0, locked);
      for (var i = locked; i < final.length; i++) out += randFor(final[i]);
      el.textContent = out;
      frame++;
      if (locked < final.length) setTimeout(tick, 33);
      else el.textContent = final;
    };
    tick();
  }
  // Hide the text until its decode starts so the real words never flash first.
  var decodeTargets = seenPage ? [] : $$('.hud, .split');
  decodeTargets.forEach(function (el) {
    el.setAttribute('data-final', el.textContent);
    el.setAttribute('aria-label', el.textContent);
    el.style.visibility = 'hidden';
  });
  var startDecode = function (sel, opts) {
    return function () {
      $$(sel).forEach(function (el) { el.style.visibility = ''; decode(el, opts); });
    };
  };

  var startDelay = arrivedByWipe ? 0.4 : (root.classList.contains('is-loading') ? 0.8 : 0.1);
  var intro = gsap.timeline({ delay: startDelay, defaults: { ease: 'power3.out' } });
  if (seenPage) {
    // Already animated earlier in this tab: show everything as-is.
  } else if ($('.home')) {
    intro.from('.taskbar__inner', { y: -24, opacity: 0, duration: 0.7 });
    intro
      .call(startDecode('.home .hud', { perChar: 1, lead: 4 }), null, '-=0.4')
      .call(startDecode('.split:not(.grad-text)', { perChar: 4, lead: 8 }), null, '+=0.15')
      .call(startDecode('.split.grad-text', { perChar: 4, lead: 8 }), null, '+=0.35')
      .from(['.home__role', '.home__pitch'], { y: 24, opacity: 0, stagger: 0.12, duration: 0.7 }, '+=0.5')
      .from('.home__actions .btn', { y: 20, opacity: 0, stagger: 0.08, duration: 0.6 }, '-=0.45')
      .from('.beams', { opacity: 0, duration: 1 }, '-=0.4');
  } else if ($('.page-head')) {
    intro.from('.taskbar__inner', { y: -24, opacity: 0, duration: 0.7 });
    intro
      .call(startDecode('.page-head .hud', { perChar: 1, lead: 4 }), null, '-=0.4')
      .from('.page-title', { y: 40, opacity: 0, duration: 0.8, ease: 'power4.out' }, '-=0.3')
      .from('.page-lead', { y: 20, opacity: 0, duration: 0.6 }, '-=0.5')
      .from('.filters .filter', { y: 14, opacity: 0, stagger: 0.05, duration: 0.4 }, '-=0.3');
  }

  /* ---------- Scroll reveals (batched, staggered) ---------- */
  if (seenPage) {
    gsap.set('.reveal', { opacity: 1, y: 0 });
  } else if (window.ScrollTrigger) {
    gsap.set('.reveal', { opacity: 0, y: 40 });
    window.ScrollTrigger.batch('.reveal', {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, stagger: 0.1, duration: 0.85, ease: 'power3.out', delay: intro.isActive() ? 0.35 : 0, overwrite: 'auto' });
      }
    });
  } else {
    gsap.set('.reveal', { opacity: 0, y: 40 });
    gsap.to('.reveal', { opacity: 1, y: 0, stagger: 0.06, duration: 0.6 });
  }

  /* ---------- Experience timeline draws itself ---------- */
  var timeline = $('.timeline');
  if (timeline && !seenPage) gsap.fromTo(timeline, { '--draw': 0 }, { '--draw': 1, duration: 1.6, ease: 'power2.inOut', delay: startDelay + 0.4 });

  /* ---------- Home: profile card floats slightly on scroll ---------- */
  if ($('.profile') && window.ScrollTrigger) {
    gsap.to('.profile', { y: -30, ease: 'none', scrollTrigger: { trigger: '.home', start: 'top top', end: 'bottom top', scrub: 0.6 } });
  }

  /* ---------- Magnetic buttons ---------- */
  $$('.magnetic').forEach(function (el) {
    var xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
    var yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
  });

  /* ---------- 3D tilt on project cards ---------- */
  $$('.tilt').forEach(function (card) {
    var rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
    var ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
    gsap.set(card, { transformPerspective: 1100 });
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 7); rx(-py * 7);
    });
    card.addEventListener('mouseleave', function () { rx(0); ry(0); });
  });

  /* ---------- Skills graph: nodes pop in after each render ---------- */
  var graphAnimated = seenPage;
  document.addEventListener('rd:graph-rendered', function () {
    if (graphAnimated) return;
    graphAnimated = true;
    gsap.from('.g-edge', { opacity: 0, duration: 0.8, stagger: 0.01, ease: 'power1.out' });
    gsap.from('.g-node circle', { attr: { r: 0 }, duration: 0.7, stagger: 0.025, ease: 'back.out(2.2)' });
    gsap.from('.g-node text', { opacity: 0, duration: 0.5, stagger: 0.02, delay: 0.3 });
  });
})();
