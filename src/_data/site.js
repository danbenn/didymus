// Single place to flip when the custom domain (didymus.org) is ready to point here.
// For now: served as a GitHub Pages *project* site, so it lives under /didymus/.
module.exports = {
  baseUrl: process.env.SITE_BASE_URL || "/didymus",
  url: process.env.SITE_URL || "https://danbenn.github.io/didymus",
};
