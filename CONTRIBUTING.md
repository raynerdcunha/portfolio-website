# Contributing

This is a personal portfolio, so I'm not looking for feature changes to the content or design. Fixes are welcome:

- Typos, broken links and accessibility problems.
- Bugs in the scripts, with steps to reproduce.

Open an issue first for anything bigger than a small fix. Keep changes small, keep the site free of frameworks and build steps, and don't add third-party requests, since the Content-Security-Policy in `vercel.json` only allows this site's own files.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) and the [Notice](NOTICE.md) on what the license covers.

## How the project is built

Plain answers to "why is it built this way?" and "how was this problem handled?". The security and privacy choices are in [SECURITY.md](SECURITY.md).

### Errors and 404 pages

**Why does every unknown address show the same 404 page?**
Visitors see a friendly page, search engines get a real 404 status, and the address stays as typed. Normal paths get this from `404.html`. Vercel handles `/api` itself, so `api/not-found.js` plus two rewrites in `vercel.json` cover `/api` and everything under it, except the three real endpoints.

**What cannot be fixed, and why is that fine?**
`/404` returns 200 because the page is a real file and files are served before rewrites. It is `noindex` and nothing links to it. A path with an encoded null character gets a plain 400 from Vercel before the project runs. Neither reveals anything useful.

### Search and AI discovery

**Why canonical tags, structured data, `sitemap.xml`, `robots.txt` and `llms.txt`?**
Each page names its one preferred address (canonical), describes itself with structured data (JSON-LD), and the sitemap lists every page. `robots.txt` allows search and AI crawlers on purpose, and `llms.txt` gives AI tools a short plain-text summary. Keep descriptions near 155 characters, because search engines cut them off.

**Why should a second address for the site redirect to the first?**
Two addresses serving the same site split search ranking and look like duplicate content. A permanent 308 redirect tells search engines there is only one site.

### Accessibility

**Why does the site check "reduce motion"?**
Some people get dizzy or distracted by animation, and their operating system lets them ask for less of it. The scripts and the CSS both respect that setting, so those visitors get the content with no animation.

### Repository

**Why is there a separate `NOTICE.md` and a plain `LICENSE`?**
GitHub detects the license by comparing the file to the standard MIT text. Extra paragraphs in `LICENSE` stopped the match. The plain MIT text stays in `LICENSE`, and the notes on what it does not cover (personal content, GSAP, fonts) live in `NOTICE.md`.

**Why is there no build step or `package.json`?**
The site is plain HTML, CSS and JavaScript, so the browser runs exactly the files in the repo. Nothing needs compiling, and there are no dependencies to keep updated. The fonts and GSAP are committed under `assets/`.

**Why do the repo-only files stay out of the deployed site?**
`.vercelignore` lists the Apps Script, `docs/`, the README and the community files so they are not served as pages.

### How problems were tackled

- **Check the live site, not just the local copy.** Headers, redirects and 404 behaviour only show up after deployment, so each change was re-tested on the real site.
- **Verify a claim before acting on it.** Several automated reviews contained wrong or out-of-date claims. Each point was tested first, and the false ones were dropped.
- **Check the repo after every push.** Files can fail to land, so the repo was read back each time.
- **Copy changed files over; never replace the whole folder.** Replacing a folder with a zip deletes everything the zip leaves out, which once removed the résumé from the repo.
- **Check the source for facts.** Numbers on the site were compared with the published paper. For example, the 83-minute baseline is an estimate in the paper, so the site says so.

### Quick re-check after any change

1. Every page returns 200 and carries all the security headers.
2. An unknown path, `/api` and `/api/nope` show the 404 page with status 404.
3. `/resume` opens the PDF, and the three real API endpoints still work.
4. `/api/leetcode?x=1` returns 400.
5. The contact page contains no Apps Script address.
