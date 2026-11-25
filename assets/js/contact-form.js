/*
 * contact-form.js — validates the contact form and posts it to this site's own /api/contact,
 * which forwards it to the Apps Script receiver (see api/contact.js). Visitors never sign in.
 */
(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form) return;

  var status = form.querySelector('.form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitHtml = submitBtn.innerHTML;
  var FALLBACK_EMAIL = 'rdcunha@ualberta.ca';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var ERRORS = {
    slow_down: 'You just sent a message — please wait a couple of minutes before sending another.',
    daily_limit: 'My inbox is busy today. Please email me directly at ' + FALLBACK_EMAIL + '.',
    bad_email: 'Please enter a valid email address.',
    missing_fields: 'Please fill in all fields.',
    too_many: 'Too many messages from your connection. Please try again later or email me at ' + FALLBACK_EMAIL + '.'
  };

  // Small client-side cooldown (the real limits are enforced by the script on the server).
  var COOLDOWN_MS = 60000;
  function coolingDown() {
    try { return Date.now() - Number(sessionStorage.getItem('rd-form-sent') || 0) < COOLDOWN_MS; } catch (e) { return false; }
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.className = 'form-status' + (type ? ' is-' + type : '');
  }

  function validate() {
    var firstBad = null;
    ['name', 'email', 'subject', 'message'].forEach(function (name) {
      var field = form.elements[name];
      var value = field.value.trim();
      var ok = value.length > 0 && (name !== 'email' || EMAIL_RE.test(value));
      field.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstBad) firstBad = field;
    });
    if (firstBad) {
      firstBad.focus();
      setStatus(firstBad.name === 'email' && firstBad.value.trim() ? ERRORS.bad_email : ERRORS.missing_fields, 'error');
      return false;
    }
    return true;
  }

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    if (form.elements._gotcha && form.elements._gotcha.value) return; // bot
    if (coolingDown()) { setStatus(ERRORS.slow_down, 'error'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setStatus('');

    fetch(form.action, { method: 'POST', body: new URLSearchParams(new FormData(form)) })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok) {
          form.reset();
          try { sessionStorage.setItem('rd-form-sent', String(Date.now())); } catch (e) {}
          setStatus('Message sent! Check your inbox for a confirmation — I\'ll get back to you soon.', 'ok');
        } else {
          setStatus(ERRORS[data && data.error] || 'Something went wrong. Please email me at ' + FALLBACK_EMAIL + '.', 'error');
        }
      })
      .catch(function () {
        setStatus('Something went wrong. Please email me directly at ' + FALLBACK_EMAIL + '.', 'error');
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitHtml;
      });
  });
})();
