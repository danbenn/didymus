module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "www.didymus.org/uploads/3/4/2/1/3421357": "files" });
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy({ "www.didymus.org/audio": "audio" });

  eleventyConfig.addCollection("pages", (api) =>
    api.getFilteredByGlob("src/pages/*.md").sort((a, b) => a.data.title.localeCompare(b.data.title))
  );

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
