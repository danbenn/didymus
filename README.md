# Didymus.org Archive

A full static mirror of [didymus.org](https://www.didymus.org) ("Early Christian
Spirituality and Spiritual Direction"), captured on 2026-07-22 before the
original Weebly site is shut down. This is a **fully self-contained** mirror —
including assets that Weebly served from its own CDN — so it will keep working
even after Weebly itself disappears.

- **246** HTML pages
- **199** PDF files
- All images, CSS, and JS assets — including those Weebly served from its own
  CDN domain (`cdn2.editmysite.com`), which a naive same-host mirror would miss
- The site's background audio track, re-hosted locally and switched from a
  dead Flash embed to a plain HTML5 `<audio>` player (see "Audio player" below)
- ~93 MB total

See [SITEMAP.md](SITEMAP.md) for a full index of every page and PDF.

## Folder structure

```
/
├── index.html                  ← redirect page to the archived site
├── www.didymus.org/            ← all site pages, images local to the site, PDFs
├── cdn2.editmysite.com/        ← Weebly CDN assets (fonts, JS, some images)
├── www.weebly.com/             ← a couple of small file-type icon images
├── SITEMAP.md
└── README.md
```

Pages reference the CDN/weebly asset folders via relative paths
(`../cdn2.editmysite.com/...`), so **keep these three folders as siblings** —
don't flatten `www.didymus.org/` into the repo root, or those relative links
will break. The root `index.html` redirect exists precisely so you get a clean
top-level URL without needing to move anything.

## Audio player

The original site embedded a Flash-based audio player (`audioPlayer2.swf`),
which has been non-functional in every modern browser since Flash was
discontinued in 2020/2021 — so it was already broken independent of Weebly's
shutdown. The underlying audio file (`monday_of_pentecost.mp3`, a Byzantine
chant recording) was still fetchable and has been downloaded to
`www.didymus.org/audio/`. The embed on the home page has been replaced with a
standard HTML5 `<audio controls>` element pointing to the local file — no
external player library needed, works in any modern browser.

## How to publish this on GitHub Pages

1. Create a new GitHub repository (public — GitHub Pages on the free tier
   requires a public repo to be reachable).
2. Copy everything in this folder into the repo root, preserving the folder
   structure above.
3. The included `.nojekyll` file is required — without it, GitHub's Jekyll
   processor can mishandle Weebly's underscore-prefixed folders/files.
4. Commit and push, then enable GitHub Pages in Settings → Pages → Deploy from
   branch → `main` / root.
5. Visit `https://<user>.github.io/<repo>/` — the root redirect will take you
   straight to `www.didymus.org/index.html`.

## Notes / known limitations

- Links were rewritten (`wget --convert-links`) to work offline/locally, so
  internal navigation between pages works as-is once hosted.
- Weebly's server-side features (site search box, contact form, comment
  widgets) will not function — there's no backend behind this archive. This
  is a static snapshot only.
- A visitor counter widget (ClustrMaps) and a Creative Commons license badge
  still point to their original external hosts — purely cosmetic, harmless if
  those services ever go away too.
- Google Analytics tracking code is still present but will simply fail
  silently (no tracking backend) — harmless, and arguably a feature.
- Consider also submitting the original site URL to the
  [Wayback Machine](https://web.archive.org/save) as a redundant backup before
  it goes offline.
