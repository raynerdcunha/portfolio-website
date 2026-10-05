/*
 * contact-form.js — validates the contact form and sends it to Rayner's Google Apps Script
 * (see google-apps-script/contact-form-receiver.gs). Visitors never sign in.
 *
 * SETUP: paste your Apps Script Web app URL (ends in /exec) into the form's action=""
 * in contact/index.html. Until then the form opens the visitor's email app instead,
 * so it never silently fails.
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
    missing_fields: 'Please fill in all fields.'
  };

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

    // Not set up yet: open the visitor's email app with everything filled in.
    if (form.action.indexOf('YOUR_SCRIPT_ID') !== -1) {
      var body = form.elements.message.value + '\n\n— ' + form.elements.name.value + ' (' + form.elements.email.value + ')';
      window.location.href = 'mailto:' + FALLBACK_EMAIL +
        '?subject=' + encodeURIComponent(form.elements.subject.value) +
        '&body=' + encodeURIComponent(body);
      setStatus('Opening your email app…', 'ok');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setStatus('');

    // URL-encoded body = "simple" request, so Google Apps Script accepts it without a CORS preflight.
    fetch(form.action, { method: 'POST', body: new URLSearchParams(new FormData(form)) })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok) {
          form.reset();
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
