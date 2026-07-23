module.exports = {
  layout: "page.njk",
  eleventyComputed: {
    permalink: (data) => (data.slug === "index" ? "/" : `/${data.slug}/`),
  },
};
