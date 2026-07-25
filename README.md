# Didymus.org

Rebuilt static site + CMS for [didymus.org](https://www.didymus.org)
("Early Christian Spirituality and Spiritual Direction"), replacing the
original Weebly-hosted site. Built to survive platform shutdowns (Weebly,
then Square) by keeping content as plain files in this git repo — no
proprietary export format, no vendor lock-in.

## How it works

- **[Eleventy](https://www.11ty.dev/)** (`eleventy.config.js`) builds static
  HTML from markdown content in `src/pages/*.md`.
- Each page is a markdown file with front-matter: `title`, `slug`, and an
  optional list of `attachments` (PDFs/docs available for download).
- **[Decap CMS](https://decapcms.org/)** (`admin/`) provides a simple
  web-based editor at `/admin/` — add or edit a page, upload a PDF — with no
  git or code knowledge required. It commits changes straight to this repo.
- **GitHub Actions** (`.github/workflows/deploy.yml`) rebuilds and deploys to
  GitHub Pages automatically on every push to `main` (including CMS edits).
- Original PDFs/docs live in `www.didymus.org/uploads/3/4/2/1/3421357/` and
  are served as-is for download alongside the page text.

## Content migration

`www.didymus.org/*.html` is the original archived Weebly mirror (captured
2026-07-22), kept as the source for the one-time conversion in
`scripts/convert.js`, which extracted each page's title, body text, and file
attachments into `src/pages/*.md`. Re-run it only if you need to re-import
from the archive; day-to-day editing should happen through `/admin/` or by
editing `src/pages/*.md` directly.

## Local development

```
npm install
npx eleventy --serve   # http://localhost:8080
```

## Editor setup (one-time, for the non-technical editor)

Decap CMS's GitHub backend needs OAuth to let a browser commit to this repo
on the editor's behalf. Since GitHub Pages is static-only, this needs one
small piece of external plumbing:

1. Create a GitHub OAuth App (Settings → Developer settings → OAuth Apps)
   for this repo. Homepage URL is the site's URL; callback URL is the proxy
   URL below + `/callback`.
2. Deploy [decap-proxy](https://github.com/sterlingwes/decap-proxy) — a
   small, self-hosted OAuth proxy — to Cloudflare Workers (free tier). It
   does the GitHub OAuth token exchange that a static GitHub Pages site can't
   do itself. `admin/config.yml`'s `backend.base_url` points at this deployed
   Worker (currently `https://decap-proxy.didymus.workers.dev`).
3. Give the editor's GitHub account write access to this repo (as a
   collaborator), then send them to `https://<your-domain>/admin/` to log in
   with GitHub and start editing.

Everything the CMS does is a normal git commit — nothing is ever
unrecoverable, and if Decap CMS itself ever goes away, the content underneath
it is just markdown files any future tool (or a text editor) can read.

## SEO

- Each page gets its own `<title>`/description and a clean URL (`/slug/`)
  instead of Weebly's bloated markup.
- `/sitemap.xml` lists every page for search engine crawlers.
- `/sitemap/` is a human-readable index of all pages.

## Custom domain

`src/static/CNAME` is deployed to the site root so GitHub Pages serves this
under `www.didymus.org` — point that domain's DNS at GitHub Pages per
[GitHub's custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Original archive

The raw Weebly mirror (`www.didymus.org/*.html`, `cdn2.editmysite.com/`,
`www.weebly.com/`) is kept in the repo as the historical source and as a
fallback — see `ARCHIVE.md` for details on that snapshot.
