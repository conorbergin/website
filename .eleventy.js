

const markdownIt = require("markdown-it")
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



    const markdownItOptions = {
        html: true,
        typographer: true
    }

    eleventyConfig.setLibrary("md", markdownIt(markdownItOptions))
    eleventyConfig.amendLibrary("md", mdLib => mdLib.use(require('markdown-it-prism'))
                                                    .use(require('markdown-it-deflist')))


    return {
        dir: {
            input: "src"
        }
    }
};
