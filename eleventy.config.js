module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "www.didymus.org/uploads/3/4/2/1/3421357": "files" });
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy({ "src/static/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "src/static/robots.txt": "robots.txt" });

  eleventyConfig.addCollection("pages", (api) =>
    api.getFilteredByGlob("src/pages/*.md").sort((a, b) => a.data.title.localeCompare(b.data.title))
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
  };
};
