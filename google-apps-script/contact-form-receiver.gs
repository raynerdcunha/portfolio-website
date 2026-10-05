/**
 * Rayner's Domain — contact form receiver (Google Apps Script)
 *
 * What it does when someone presses "Send message" on the website:
 *   1. Emails the message to DELIVER_TO (or this account's inbox if left blank).
 *      Hitting "Reply" in Gmail replies straight to the visitor.
 *   2. Sends the visitor a short "thanks, I got your message" confirmation.
 *
 * Visitors never sign in. No passwords or API keys live in the website code.
 *
 * Setup (once):
 *   script.google.com → New project → paste this file → Save
 *   Deploy → New deployment → type "Web app"
 *     Execute as: Me      Who has access: Anyone
 *   Deploy → Authorize → copy the Web app URL (ends in /exec)
 *   Paste that URL into the form's action="" in contact/index.html
 *
 * After editing this script later: Deploy → Manage deployments → ✏️ → Version: New version → Deploy
 * (the URL stays the same).
 */

const OWNER_NAME = 'Rayner Dcunha';

// Run this script while signed in to your WEBSITE Google account; all emails are sent from that account.
// DELIVER_TO: where new messages should land. Leave '' to keep them in the website account's inbox,
// or put your main address (e.g. 'you@gmail.com') to have them delivered there instead.
const DELIVER_TO = '';
// REPLY_TO_FOR_VISITORS: if a visitor replies to their confirmation email, where it goes.
// Leave '' to use the website account.
const REPLY_TO_FOR_VISITORS = '';
const SITE_URL = 'https://raynerdcunha.vercel.app';
const SEND_CONFIRMATION = true;   // set to false to stop auto-replies to visitors
const DAILY_LIMIT = 40;           // max messages per day (protects your Gmail sending quota)
const TIME_ZONE = 'America/Edmonton';

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};

    // Spam trap: real people never fill in this hidden field.
    if (p._gotcha) return json({ ok: true });

    const name = clean(p.name, 100);
    const email = clean(p.email, 200);
    const subject = clean(p.subject, 150);
    const message = clean(p.message, 5000);

    if (!name || !email || !subject || !message) return json({ ok: false, error: 'missing_fields' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: 'bad_email' });

    // Rate limits: one message per email address every 2 minutes, plus a daily cap.
    const cache = CacheService.getScriptCache();
    const senderKey = 'sender:' + email.toLowerCase();
    if (cache.get(senderKey)) return json({ ok: false, error: 'slow_down' });

    const props = PropertiesService.getScriptProperties();
    const dayKey = 'count:' + Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');
    const sentToday = Number(props.getProperty(dayKey) || 0);
    if (sentToday >= DAILY_LIMIT) return json({ ok: false, error: 'daily_limit' });

    const me = Session.getEffectiveUser().getEmail();   // the website account running this script
    const inbox = DELIVER_TO || me;
    const replyTarget = REPLY_TO_FOR_VISITORS || me;
    const when = Utilities.formatDate(new Date(), TIME_ZONE, "EEE, MMM d yyyy 'at' h:mm a z");

    // 1) The message, to you
    MailApp.sendEmail({
      to: inbox,
      replyTo: email,
      name: 'Rayner\'s Domain — contact form',
      subject: '[Portfolio] ' + subject,
      body:
        'New message from your portfolio contact form\n' +
        '──────────────────────────────────────────\n' +
        'From:    ' + name + ' <' + email + '>\n' +
        'Subject: ' + subject + '\n' +
        'Sent:    ' + when + '\n\n' +
        message + '\n\n' +
        '──────────────────────────────────────────\n' +
        'Press Reply to answer ' + name + ' directly.'
    });

    // 2) Confirmation to the visitor. Deliberately does NOT repeat their message,
    //    so the form can't be abused to send someone else custom text in your name.
    if (SEND_CONFIRMATION) {
      MailApp.sendEmail({
        to: email,
        replyTo: replyTarget,
        name: OWNER_NAME,
        subject: 'Thanks for reaching out — ' + OWNER_NAME,
        body:
          'Hi ' + name + ',\n\n' +
          'Thanks for your message through my portfolio — it has reached my inbox and I\'ll get back to you soon.\n\n' +
          'Best,\n' + OWNER_NAME + '\n' + SITE_URL + '\n\n' +
          '(This is an automatic confirmation. If you didn\'t send a message, you can ignore this email.)'
      });
    }

    cache.put(senderKey, '1', 120);
    props.setProperty(dayKey, String(sentToday + 1));
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'server_error' });
  }
}

// Visiting the /exec URL in a browser shows this — handy to check the deployment is live.
function doGet() {
  return json({ ok: true, status: 'Rayner\'s Domain contact form is running' });
}

function clean(value, max) {
  return String(value || '').replace(/\r/g, '').trim().slice(0, max);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
