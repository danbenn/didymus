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

  // The nav hierarchy is derived from each page's own `parent` (slug of parent
  // page) and `order` (sort position among siblings) front matter fields,
  // rather than a hand-maintained nav.json — so filing a page under a section
  // is just picking its parent in Decap CMS, no separate file to edit.
  eleventyConfig.addCollection("navTree", (api) => {
    const pages = api.getFilteredByGlob("src/pages/*.md").filter((p) => p.data.slug !== "index");
    const bySlug = new Map(pages.map((p) => [p.data.slug, p]));

    function buildNode(page) {
      const children = pages
        .filter((p) => p.data.parent === page.data.slug)
        .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
        .map(buildNode);
      const node = { title: page.data.title, slug: page.data.slug };
      if (children.length) node.children = children;
      return node;
    }

    const roots = pages
      .filter((p) => !p.data.parent || !bySlug.has(p.data.parent))
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
      .map(buildNode);

    return [{ title: "Home", slug: "" }, ...roots];
  });

  // Lets any page auto-render an "In this section" list of its children,
  // whether it's a pure category page or a content page someone later filed
  // other pages under.
  eleventyConfig.addCollection("childrenBySlug", (api) => {
    const pages = api.getFilteredByGlob("src/pages/*.md");
    const map = {};
    for (const p of pages) {
      if (!p.data.parent) continue;
      (map[p.data.parent] ??= []).push({ title: p.data.title, slug: p.data.slug });
    }
    for (const slug in map) {
      const parentPage = pages.find((p) => p.data.slug === slug);
      map[slug].sort((a, b) => {
        const pa = pages.find((p) => p.data.slug === a.slug)?.data.order ?? 0;
        const pb = pages.find((p) => p.data.slug === b.slug)?.data.order ?? 0;
        return pa - pb;
      });
    }
    return map;
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
