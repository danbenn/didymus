// One-time migration: converts the archived Weebly HTML mirror into
// Eleventy content (markdown + front-matter) under src/pages/.
// Source HTML lives in www.didymus.org/*.html (kept as read-only archive reference).
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const TurndownService = require("turndown");

const SRC_DIR = path.join(__dirname, "..", "www.didymus.org");
const OUT_DIR = path.join(__dirname, "..", "src", "pages");
const UPLOADS_SRC = path.join(SRC_DIR, "uploads", "3", "4", "2", "1", "3421357");

const turndown = new TurndownService({ headingStyle: "atx" });

function slugify(name) {
  return name.replace(/\.html$/, "");
}

function extractAttachments($, content) {
  const attachments = [];
  content.find("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const m = href.match(/uploads\/3\/4\/2\/1\/3421357\/(.+)$/);
    if (m) {
      const file = decodeURIComponent(m[1]);
      if (!attachments.some((a) => a.file === file)) {
        attachments.push({ file, url: `/files/${file}` });
      }
    }
  });
  return attachments;
}

function stripDownloadWidgets($, content) {
  // Weebly's file-download widget: a div containing an <a><img file-icon></a> + table + "Download File" link.
  content.find("div").each((_, el) => {
    const $el = $(el);
    if ($el.find('a[title^="Download file:"]').length && $el.find("table").length) {
      $el.remove();
    }
  });
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith(".html"));
  let converted = 0;
  const skipped = [];

  for (const file of files) {
    const slug = slugify(file);
    const html = fs.readFileSync(path.join(SRC_DIR, file), "utf-8");
    const $ = cheerio.load(html);

    const rawTitle = $("title").text().trim();
    const title = rawTitle.split(" - ")[0].replace(/ /g, "").trim() || slug;

    const contentRoot = $("#wsite-content");
    if (!contentRoot.length) {
      skipped.push(file);
      continue;
    }

    const attachments = extractAttachments($, contentRoot);
    stripDownloadWidgets($, contentRoot);

    // Rewrite internal page links (relative "some-page.html") to clean site URLs.
    contentRoot.find("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const m = href.match(/^([\w-]+)\.html$/);
      if (m) $(el).attr("href", `/${m[1]}/`);
    });

    // Drop empty leftover wrapper divs/hrs from the widget removal.
    contentRoot.find("hr[style*='visibility: hidden']").remove();

    const bodyHtml = contentRoot.html() || "";
    let markdown = turndown.turndown(bodyHtml).trim();

    const frontMatter = [
      "---",
      `title: ${JSON.stringify(title)}`,
      `slug: ${JSON.stringify(slug)}`,
      "attachments:",
      ...attachments.map((a) => `  - file: ${JSON.stringify(a.file)}\n    url: ${JSON.stringify(a.url)}`),
      "---",
      "",
    ].join("\n");

    fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), frontMatter + markdown + "\n");
    converted++;
  }

  console.log(`Converted ${converted} pages into ${OUT_DIR}`);
  if (skipped.length) console.log(`Skipped (no #wsite-content found): ${skipped.join(", ")}`);
}

main();
