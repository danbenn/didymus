const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

function markdownToPlainText(md) {
  return md
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "www.didymus.org/uploads/3/4/2/1/3421357": "files" });
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy({ "www.didymus.org/audio": "audio" });

  eleventyConfig.addCollection("pages", (api) =>
    api.getFilteredByGlob("src/pages/*.md").sort((a, b) => a.data.title.localeCompare(b.data.title))
  );

  eleventyConfig.on("eleventy.after", ({ dir }) => {
    const pagesDir = path.join(__dirname, "src/pages");
    const index = fs
      .readdirSync(pagesDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => {
        const raw = fs.readFileSync(path.join(pagesDir, f), "utf8");
        const { data, content } = matter(raw);
        if (!data.slug || !data.title) return null;
        const text = markdownToPlainText(content).slice(0, 3000);
        return { title: data.title, url: `/${data.slug}/`, content: text };
      })
      .filter(Boolean);
    fs.writeFileSync(path.join(dir.output, "search-index.json"), JSON.stringify(index));
  });

  // Rewrites root-relative href/src ("/css/...", "/slug/", "/files/...") to include
  // the site's baseUrl (see src/_data/site.js) — needed while served as a GitHub
  // Pages project site under /didymus/ rather than a custom domain's root.
  eleventyConfig.addTransform("rewrite-base-url", function (content, outputPath) {
    const baseUrl = process.env.SITE_BASE_URL || "/didymus";
    if (!baseUrl || !outputPath || !outputPath.endsWith(".html")) return content;
    return content.replace(/(href|src)="\/(?!\/)/g, `$1="${baseUrl}/`);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
  };
};
