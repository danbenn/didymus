# Original Weebly Archive (historical snapshot)

This document describes the raw static mirror captured from the Weebly-hosted
`didymus.org` on 2026-07-22, before that platform was shut down. It's kept in
this repo as the source data for the current Eleventy/Decap CMS site (see
`README.md`) and as a raw fallback.

- **246** HTML pages
- **199** PDF files
- All images, CSS, and JS assets — including those Weebly served from its own
  CDN domain (`cdn2.editmysite.com`), which a naive same-host mirror would miss
- The site's background audio track, re-hosted locally and switched from a
  dead Flash embed to a plain HTML5 `<audio>` player (see "Audio player" below)
- ~93 MB total

See [SITEMAP.md](SITEMAP.md) for a full index of every page and PDF from the
original site.

## Folder structure

```
/
├── www.didymus.org/            ← all original site pages, images, PDFs
├── cdn2.editmysite.com/        ← Weebly CDN assets (fonts, JS, some images)
├── www.weebly.com/             ← a couple of small file-type icon images
└── SITEMAP.md
```

Pages reference the CDN/weebly asset folders via relative paths
(`../cdn2.editmysite.com/...`), so these three folders need to stay siblings
if this raw archive is ever served directly instead of through the Eleventy
build.

## Audio player

The original site embedded a Flash-based audio player (`audioPlayer2.swf`),
which has been non-functional in every modern browser since Flash was
discontinued in 2020/2021 — so it was already broken independent of Weebly's
shutdown. The underlying audio file (`monday_of_pentecost.mp3`, a Byzantine
chant recording) was still fetchable and has been downloaded to
`www.didymus.org/audio/`. The embed on the home page has been replaced with a
standard HTML5 `<audio controls>` element pointing to the local file — no
external player library needed, works in any modern browser.

## Notes / known limitations of this raw archive

- Links were rewritten (`wget --convert-links`) to work offline/locally.
- Weebly's server-side features (site search box, contact form, comment
  widgets) do not function — there's no backend behind this archive.
- A visitor counter widget (ClustrMaps) and a Creative Commons license badge
  still point to their original external hosts.
- Google Analytics tracking code is still present but fails silently (no
  tracking backend).
