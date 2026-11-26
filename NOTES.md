# Design and security notes

Plain answers to "why is it built this way?" and "how was this problem handled?". Read this before changing the security headers, the API functions or the contact form.

## Security and privacy

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

## Errors and 404 pages

**Why does every unknown address show the same 404 page?**
Visitors see a friendly page, search engines get a real 404 status, and the address stays as typed. Normal paths get this from `404.html`. Vercel handles `/api` itself, so `api/not-found.js` plus two rewrites in `vercel.json` cover `/api` and everything under it, except the three real endpoints.

**What cannot be fixed, and why is that fine?**
`/404` returns 200 because the page is a real file and files are served before rewrites. It is `noindex` and nothing links to it. A path with an encoded null character gets a plain 400 from Vercel before the project runs. Neither reveals anything useful.

## Search and AI discovery

**Why canonical tags, structured data, `sitemap.xml`, `robots.txt` and `llms.txt`?**
Each page names its one preferred address (canonical), describes itself with structured data (JSON-LD), and the sitemap lists every page. `robots.txt` allows search and AI crawlers on purpose, and `llms.txt` gives AI tools a short plain-text summary. Keep descriptions near 155 characters, because search engines cut them off.

**Why should a second address for the site redirect to the first?**
Two addresses serving the same site split search ranking and look like duplicate content. A permanent 308 redirect tells search engines there is only one site.

## Accessibility

**Why does the site check "reduce motion"?**
Some people get dizzy or distracted by animation, and their operating system lets them ask for less of it. The scripts and the CSS both respect that setting, so those visitors get the content with no animation.

## Repository

**Why is there a separate `NOTICE.md` and a plain `LICENSE`?**
GitHub detects the license by comparing the file to the standard MIT text. Extra paragraphs in `LICENSE` stopped the match. The plain MIT text stays in `LICENSE`, and the notes on what it does not cover (personal content, GSAP, fonts) live in `NOTICE.md`.

**Why is there no build step or `package.json`?**
The site is plain HTML, CSS and JavaScript, so the browser runs exactly the files in the repo. Nothing needs compiling, and there are no dependencies to keep updated. The fonts and GSAP are committed under `assets/`.

**Why do the repo-only files stay out of the deployed site?**
`.vercelignore` lists the Apps Script, `docs/`, the README and the community files so they are not served as pages.

## How problems were tackled

- **Check the live site, not just the local copy.** Headers, redirects and 404 behaviour only show up after deployment, so each change was re-tested on the real site.
- **Verify a claim before acting on it.** Several automated reviews contained wrong or out-of-date claims. Each point was tested first, and the false ones were dropped.
- **Check the repo after every push.** Files can fail to land, so the repo was read back each time.
- **Copy changed files over; never replace the whole folder.** Replacing a folder with a zip deletes everything the zip leaves out, which once removed the résumé from the repo.
- **Check the source for facts.** Numbers on the site were compared with the published paper. For example, the 83-minute baseline is an estimate in the paper, so the site says so.

## Quick re-check after any change

1. Every page returns 200 and carries all the security headers.
2. An unknown path, `/api` and `/api/nope` show the 404 page with status 404.
3. `/resume` opens the PDF, and the three real API endpoints still work.
4. `/api/leetcode?x=1` returns 400.
5. The contact page contains no Apps Script address.
