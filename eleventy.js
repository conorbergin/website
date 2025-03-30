

// const markdownIt = require("markdown-it")
// const markdownItAnchor = require("markdown-it-anchor")


module.exports = function (eleventyConfig) {

    eleventyConfig.addPassthroughCopy("src/**/*.jpg");
    eleventyConfig.addPassthroughCopy("src/**/*.png");
    eleventyConfig.addPassthroughCopy("src/**/*.webp");
    eleventyConfig.addPassthroughCopy("src/**/*.webm");
    eleventyConfig.addPassthroughCopy("src/**/*.mp4");
    eleventyConfig.addPassthroughCopy("src/**/*.ttf");
    eleventyConfig.addPassthroughCopy("src/**/*.txt");
    eleventyConfig.addPassthroughCopy("src/**/*.css");
    eleventyConfig.addPassthroughCopy("src/**/*.svg");
    eleventyConfig.addPassthroughCopy("src/**/*.pdf");
    eleventyConfig.addPassthroughCopy("src/**/*.txt");
    eleventyConfig.addPassthroughCopy("src/**/*.js");
    eleventyConfig.addPassthroughCopy("src/**/*.csv");

	// Use the default sorting algorithm in reverse (descending dir, date, filename)
	// Note that using a template engine’s `reverse` filter might be easier here
	eleventyConfig.addCollection("myPostsReverse", function (collectionsApi) {
		return collectionsApi.getAllSorted().reverse();
	});


    eleventyConfig.addFilter("niceDate",function(date) {
        const d = new Date(date)
        return d.toDateString()
    })




    // const markdownItOptions = {
    //     html: true,
    //     typographer: true
    // }

    // eleventyConfig.setLibrary("md", markdownIt(markdownItOptions))
    // eleventyConfig.amendLibrary("md", mdLib => mdLib.use(require('markdown-it-prism'))
    //     .use(require('markdown-it-deflist')))


    return {
        markdownTemplateEngine: "njk",
        dir: {
            input: "src"
        }
    }
};
