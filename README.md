<p align="center">
  <a href="https://www.raynerdcunha.com"><img src="docs/readme-banner.svg" alt="Rayner's Domain — portfolio of Rayner Dcunha" width="100%"></a>
</p>

<p align="center">
  <a href="https://www.raynerdcunha.com"><img src="https://img.shields.io/badge/Live-www.raynerdcunha.com-22e3ff?style=for-the-badge&logo=vercel&logoColor=white&labelColor=05060d" alt="Live site"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/Code-MIT-a78bfa?style=for-the-badge&labelColor=05060d" alt="MIT License"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-05060d?style=flat-square&logo=html5&logoColor=E34F26" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-05060d?style=flat-square&logo=css&logoColor=1572B6" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-05060d?style=flat-square&logo=javascript&logoColor=F7DF1E" alt="JavaScript">
  <img src="https://img.shields.io/badge/GSAP-05060d?style=flat-square&logo=greensock&logoColor=88CE02" alt="GSAP">
  <img src="https://img.shields.io/badge/SVG%20%2F%20Canvas-05060d?style=flat-square&logo=svg&logoColor=FFB13B" alt="SVG / Canvas">
  <img src="https://img.shields.io/badge/Google%20Apps%20Script-05060d?style=flat-square&logo=googleappsscript&logoColor=4285F4" alt="Google Apps Script">
  <img src="https://img.shields.io/badge/Vercel-05060d?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
</p>

# Rayner's Domain: Portfolio Website

The source code for [www.raynerdcunha.com](https://www.raynerdcunha.com), the personal portfolio of **Rayner Dcunha** (Computer Engineering Co-Op, University of Alberta).

It's a dark, animated, multi-page static site with **no framework and no build step**: plain HTML, CSS and JavaScript, plus one small serverless function. You can download it, run it locally and use it as a starting point for your own portfolio.

---

## Features

- **Interactive skills knowledge graph**: a live physics simulation written from scratch (no graph library). Drag nodes, hover to see where a skill was used, click a category to hide it.
- **Serverless contact form**: the form posts to this site's own `api/contact.js`, which checks it and forwards it to a Google Apps Script that emails each message to you and sends the visitor a confirmation. The browser never talks to Google, so the visitor's IP stays on this site. Visitors don't sign in.
- **Live LeetCode stat**: a small Vercel serverless function (`api/leetcode.js`) reads the public solved counts and caches them for 3 minutes. The home page shows the total, the easy/medium/hard split and a colored ring, and links to the profile. If it can't reach LeetCode, the page keeps its built-in fallback numbers.
- **"My side / your side" panel**: the owner's local time and weather next to the visitor's. The browser only talks to this site: `api/weather.js` asks [Open-Meteo](https://open-meteo.com) server-side, so the visitor's IP address is never sent to a third party. No API key and no location prompt.
- **Privacy and security by default**: no cookies, analytics or third-party requests from the visitor's browser (fonts are self-hosted, and weather and the contact form go through this site's own functions), a strict Content-Security-Policy plus HSTS and Permissions-Policy in `vercel.json`, and `/.well-known/security.txt`.
- **GSAP motion**: page-wipe transitions, decode-text intro, scroll reveals, magnetic buttons, 3D card tilt.
- **Clean URLs** (`/projects`, `/skills`) that work on Vercel and any static server.
- **Search and AI-search ready**: a unique title and description per page, OpenGraph and Twitter cards, JSON-LD structured data, `sitemap.xml`, `robots.txt`, and an `llms.txt` summary for AI tools.

**Tech:** HTML · CSS · JavaScript · GSAP + ScrollTrigger (bundled) · SVG / Canvas · Google Apps Script · Vercel

---

## Run it locally

You only need a browser and Python (or any static file server).

```bash
git clone https://github.com/raynerdcunha/portfolio-website.git
cd portfolio-website
python -m http.server 8000
```

Then open **http://localhost:8000**.

> Open it through a local server like the one above, not by double-clicking `index.html`. The pages use root paths (`/assets/...`) that only resolve when served.
>
> A plain static server doesn't run `api/leetcode.js`, `api/weather.js` or `api/contact.js`, so locally the LeetCode stat shows its fallback numbers, the weather shows a dash and the contact form can't send. To test the live version, use [`vercel dev`](https://vercel.com/docs/cli/dev) or check the deployed site.

---

## Project structure

```text
├── index.html                      # Home
├── experience/index.html           # Experience, leadership, awards
├── projects/index.html             # Project cards (filterable)
├── skills/index.html               # Knowledge graph + list view, certifications
├── contact/index.html              # Contact form + links
├── 404.html                        # "Lost in the Domain?"
├── robots.txt, sitemap.xml         # Search engine hints
├── humans.txt                      # Who made the site
├── llms.txt                        # Plain-text site summary for AI tools
├── favicon.ico, site.webmanifest   # Icons for browsers and phones
├── .well-known/security.txt        # How to report a security issue
├── api/
│   ├── leetcode.js                 # Serverless function: live LeetCode counts (Vercel)
│   ├── weather.js                  # Serverless function: weather proxy, keeps visitor IPs from Open-Meteo
│   ├── contact.js                  # Serverless function: checks the contact form, rate-limits per IP, forwards to the Apps Script
│   └── [...path].js                # Any other /api/ address: shows the 404 page with a real 404 status
├── assets/
│   ├── css/
│   │   ├── main.css                # All styles; colour tokens are at the top
│   │   └── fonts.css               # @font-face rules for the self-hosted fonts
│   ├── js/
│   │   ├── boot.js                 # Adds the `js` class before the page paints (no inline script, for the CSP)
│   │   ├── 404.js                  # 404 page script (no inline script, for the CSP)
│   │   ├── motion.js               # Taskbar, page wipe, intro, scroll reveals, tilt, magnetic buttons
│   │   ├── site-shell.js           # Loader, card glow, counters, typed text
│   │   ├── space-network.js        # Home background
│   │   ├── time-weather.js         # Time + weather panel
│   │   ├── project-effects.js      # Project filters, terminal animation
│   │   ├── leetcode-stat.js        # Home page: fills the LeetCode stat from /api/leetcode
│   │   ├── skills-data.js          # Skills content (graph + list read from here)
│   │   ├── skills-graph.js         # Knowledge graph engine
│   │   └── contact-form.js         # Form validation + posting to /api/contact
│   ├── fonts/                      # Self-hosted Inter, JetBrains Mono, Space Grotesk (SIL OFL)
│   ├── vendor/                     # GSAP + ScrollTrigger
│   ├── images/                     # Favicons, app icons, social preview image
│   └── resume/                     # Résumé PDF
├── google-apps-script/
│   └── contact-form-receiver.gs    # Contact form backend (runs on script.google.com)
├── docs/readme-banner.svg          # README banner
├── LICENSE                         # MIT license (code)
├── NOTICE.md                       # What the license does and doesn't cover
├── SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md
├── .github/                        # Issue and pull request templates
├── vercel.json                     # Clean URLs, security headers, caching
├── .vercelignore                   # Keeps the script, docs and repo-only files out of the deploy
└── .gitignore                      # Files Git should skip
```

---

## Make it your own

The text, résumé and branding in this repo belong to Rayner Dcunha (see [License](#license)). Replace them before you publish your own version.

| Change | Where |
|---|---|
| Name, intro, profile card, stats | `index.html` |
| Jobs, leadership, awards | `experience/index.html` |
| Projects | `projects/index.html` |
| Skills (graph + list) | `assets/js/skills-data.js`: each skill lists where you used it, and node size grows with that count |
| Certifications | `skills/index.html` |
| Links + availability | `contact/index.html` and the taskbar in every page |
| Résumé | `assets/resume/`, then update the links that point to it |
| Colours | CSS variables at the top of `assets/css/main.css` |
| Logo / favicon | `assets/images/rd-logo.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, and `favicon.ico` in the root |
| LeetCode username (live stat) | `USERNAME` at the top of `api/leetcode.js`; the fallback numbers are in `index.html` |
| Contact form destination | the `CONTACT_SCRIPT_URL` environment variable in Vercel (see below); the form itself posts to `/api/contact` |
| Your city for time/weather | `ME` (time zone and name) at the top of `assets/js/time-weather.js`, and `ME` (coordinates) at the top of `api/weather.js` |
| Site URL | `canonical` / `og:` / `twitter:` tags and the JSON-LD block in each page, `sitemap.xml`, `robots.txt`, `llms.txt` |

The taskbar is copied into each page. If you add or rename a page, update it in all of them.

---

## Set up the contact form (your own inbox)

1. Sign in to the Google account that should send the emails, go to [script.google.com](https://script.google.com) and click **New project**.
2. Paste in everything from `google-apps-script/contact-form-receiver.gs`. Set `OWNER_NAME`, `SITE_URL` and (optionally) `DELIVER_TO` at the top, then **Save**.
3. **Deploy → New deployment →** gear icon **→ Web app**. Set Execute as **Me** and Who has access **Anyone**, then **Deploy**.
4. Click **Authorize**, choose your account, then **Advanced → Go to project → Allow**. Google shows this warning because the script is your own and unverified, which is expected.
5. Copy the **Web app URL** (it ends in `/exec`). Don't put it in the page: in Vercel, open your project, go to **Settings → Environment Variables**, add `CONTACT_SCRIPT_URL` with that URL for Production, then redeploy. The form posts to `/api/contact`, which reads the variable and forwards the message.

When you edit the script later, go to **Deploy → Manage deployments → Edit → New version**. The URL stays the same.

**Keep the Web app URL private.** Anyone who has it can post to your script, so keep it only in the Vercel environment variable, never in a file, commit, screenshot or issue. If it ever leaks (or you committed it by mistake), go to **Deploy → Manage deployments**, archive that deployment, create a **New deployment**, and put the new URL in `CONTACT_SCRIPT_URL`. Removing a URL from a file does not remove it from Git history, so replacing the deployment is the real fix.

The script has a spam trap and rate limits built in: one message per sender every 2 minutes, and a daily cap. `api/contact.js` adds its own checks first: same-site requests only, field length limits, a spam trap, and 5 messages per hour per IP address (kept in memory, so it is a light limit, not a hard one). The visitor's IP is never forwarded to the script. If `CONTACT_SCRIPT_URL` is missing, the form shows an error with your fallback email address. The function answers with real status codes: 400 for bad input, 429 for too many messages, 502 when the script can't be reached or refuses the message, and 503 when the variable is missing.

---

## Deploy on Vercel

1. Push the project to your own GitHub repo.
2. In [Vercel](https://vercel.com), go to **Add New → Project** and import the repo.
3. Use these settings:
   - **Framework Preset:** Other
   - **Build Command:** *(empty)*
   - **Output Directory:** *(empty)*
   - **Install Command:** *(empty)*
4. Add the `CONTACT_SCRIPT_URL` environment variable (see the contact form section), then click **Deploy**. After that, every push to `main` redeploys automatically.
5. If you also have an apex domain or a `.vercel.app` address, open **Settings → Domains**, edit it and choose **Redirect to** your main domain with a **308** status, so search engines see one site.

Any other static host (Netlify, GitHub Pages, Cloudflare Pages) works too, but only Vercel runs `api/leetcode.js`, `api/weather.js` and `api/contact.js`; elsewhere the LeetCode stat shows its fallback numbers, the weather shows a dash and the contact form cannot send. `vercel.json` only adds Vercel-specific extras.

---

## Notes

- `api/weather.js` and `api/leetcode.js` time out slow upstream calls and reject unknown query parameters with a 400, so adding `?x=1` can't be used to bypass the cache.
- Designed for laptop and desktop screens; phones get a basic stacked layout.
- Visitors who turn on the OS "reduce motion" setting get no animations: content shows immediately and the terminal and background are static (checked in `motion.js`, `site-shell.js`, `project-effects.js` and `space-network.js`).

---

## License

- **Code** (HTML, CSS, JavaScript and the Apps Script): [MIT License](LICENSE). You're free to use, modify and share it. See [NOTICE.md](NOTICE.md) for exactly what it covers.
- **Personal content**: the name, biography, experience, project descriptions, résumé, photos and "Rayner's Domain" / RD branding are **© 2026 Rayner Dcunha. All rights reserved.** They are not covered by the MIT License. Please replace them with your own.
- **GSAP** in `assets/vendor/` is © GreenSock and is used under the [GSAP Standard License](https://gsap.com/standard-license), not the MIT License.

If this repo helped you build your portfolio, a link back is appreciated but not required.