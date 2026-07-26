# dannyhanes.com

Static replacement for the Squarespace site, built for GitHub Pages. No build
step, no dependencies — plain HTML, one shared stylesheet, one vanilla JS file,
and locally-hosted images (everything was pulled off the Squarespace CDN, so
nothing breaks when the Squarespace subscription ends).

## Interactive features

- **Live smart-home panel** (home page) — a Home Assistant-style card grid that
  actually controls the site: *Site Lights* toggles light/dark theme (with a
  circular reveal via the View Transitions API), *Back Door* cycles the lock
  states from the blog post, *Accent* re-tints the entire site by rotating the
  `--hue` CSS variable, and *Motion* really detects visitor activity.
- **Command palette** — `⌘K` / `Ctrl K` / `/` opens fuzzy-searchable navigation
  plus actions (theme, accent, copy email, party mode).
- **Particle constellation** background that reacts to the cursor, plus an
  animated aurora mesh and cursor spotlight — all hue-aware.
- **Scroll-reveal** animations, 3D-tilt cards, typing-effect tagline, reading
  progress bar on articles, cross-document page transitions.
- **Konami code** (`↑↑↓↓←→←→BA`) → party mode.
- Theme + accent persist in `localStorage`; `prefers-reduced-motion` disables
  particles, tilt, typing, and reveals; everything degrades gracefully with JS
  off (styled, readable, navigable).

## Structure

| Path | Page |
|---|---|
| `index.html` | Landing page (photo, bio, link cards) |
| `blog/` | Blog listing |
| `blog/home-assistant-lock-card/` | "Custom Lock Card" post (same URL as the old site) |
| `about/` | About page |
| `career/` | Career timeline (Kandji, Allstate, UNC Charlotte, Apple) |
| `contact/` | Contact page (email + socials; the old Squarespace form needed a backend) |
| `404.html` | Not-found page |
| `assets/style.css` | Shared stylesheet (light/dark via `prefers-color-scheme`) |
| `assets/images/` | All site images |
| `sitemap.xml`, `robots.txt` | SEO |

Old Squarespace URLs (`/career-updates/*`, `/career-v2`, `/blog/category/Home+Assistant`,
`/store-4-1`) have redirect stubs pointing at their new homes, so inbound links
keep working.

## Deploy to GitHub Pages

1. Create the repo — name it `<username>.github.io` to serve at the root, or
   any name for a project site; all paths are relative, so both work.
2. Push:
   ```sh
   git init
   git add .
   git commit -m "Static site"
   git remote add origin git@github.com:<username>/<repo>.git
   git push -u origin main
   ```
3. **Settings → Pages → Source: Deploy from a branch → `main` / root**.

## Pointing dannyhanes.com here

1. In **Settings → Pages → Custom domain**, enter `dannyhanes.com` (GitHub adds
   a `CNAME` file to the repo).
2. At your DNS provider (remove the Squarespace records first):
   - `A` records on the apex for `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` → `<username>.github.io`
3. Enable **Enforce HTTPS** once the certificate is issued.
4. Cancel Squarespace only after the new site is live — the images are already
   local, so nothing on the site depends on Squarespace.

## Editing

- Content: edit the HTML directly; each page carries its own header/footer.
- Colors/design: CSS variables at the top of `assets/style.css` (light theme in
  `:root`, dark overrides in the `prefers-color-scheme: dark` block).
- New blog post: copy `blog/home-assistant-lock-card/index.html` as a template
  into `blog/<slug>/index.html`, then add a card to `blog/index.html` and a line
  to `sitemap.xml`.

## Local preview

Double-clicking any page works — paths are relative, and a small script in
`assets/site.js` rewrites directory-style links (`blog/` → `blog/index.html`)
when browsing from disk. For a preview that exactly matches the deployed site:

```sh
python3 -m http.server 8080   # then open http://localhost:8080
```

Note: `404.html` intentionally keeps root-absolute paths (GitHub Pages serves
it at arbitrary nested URLs), so it only styles correctly when served.
