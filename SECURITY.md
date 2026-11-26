# Security policy

If you find a security problem on www.raynerdcunha.com or in this repository, please report it privately through the [contact form](https://www.raynerdcunha.com/contact) and include "Security" in the subject. Please don't open a public issue for a vulnerability.

You'll get a reply as soon as I can. Please give me reasonable time to fix the problem before sharing details publicly.

This is a personal static site with no user accounts and no stored visitor data.

## Why it is built this way

Plain answers about the security and privacy choices. Read these before changing the headers, the API functions or the contact form.

**Why a strict Content-Security-Policy, with no inline scripts or styles?**
The policy in `vercel.json` tells the browser to load files only from this site. If a bad script were ever injected, or a file tried to load from somewhere else, the browser would block it. The price is that every script and style lives in its own file (that is why `boot.js` and `404.js` exist). Do not add `unsafe-inline` to make something work; move the code into a file instead.

**Why are the fonts self-hosted, and why do weather and the contact form go through this site's own `/api/` functions?**
Any request from a visitor's browser to another company shows that company the visitor's IP address. Routing everything through this site means no third party sees the visitor at all. It also lets the CSP stay at `'self'`.

**Why does the contact form post to `/api/contact` and not straight to Google?**
Two reasons. Google never sees the visitor's IP address, and the Apps Script address never appears in the page, so nobody can find it and post to the script directly. The address lives only in the `CONTACT_SCRIPT_URL` environment variable.

**What if a private address ever ends up in a public repo?**
Removing it from the files is not enough, because it stays in Git history. The real fix is to replace it: archive the old deployment, create a new one, and put the new address in the environment variable. Treat anything that was public once as public forever.

**Why limit messages in two places?**
`api/contact.js` checks the sender's IP and is quick, but it only remembers requests in memory, so it is a speed bump, not a wall. The Apps Script enforces the real limits (one message per sender every 2 minutes, plus a daily cap). Together they keep spam low without storing anything about visitors.

**Why a hidden spam-trap field, and a same-origin check?**
Simple bots fill every field, so a hidden field catches them with no captcha and no third party. The same-origin check rejects requests that come from other websites.

**Why do the API functions time out and reject unknown query parameters?**
Without a timeout, a slow upstream service can hold a request open. Without the parameter check, adding `?x=1`, `?x=2` and so on makes every request look new to the cache, so each one calls the upstream service and can use up its rate limit. Rejecting anything unexpected closes that door.

**Why real status codes, such as 400, 429 and 502?**
So that errors are honest: 400 for bad input, 429 for too many requests, 502 when the service behind the function fails. Tools and browsers read those codes, and failures that return 200 hide problems.

**Why did the résumé get its own CSP exclusion?**
A PDF does not need the page policy. The exclusion pattern is exact on purpose: only `/resume` and `/assets/resume/` skip it, so a path like `/resume-old` still gets the policy.
