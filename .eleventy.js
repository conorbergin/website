

// const mathjaxPlugin = require("eleventy-plugin-mathjax");
const markdownIt = require("markdown-it")
// const markdownItAnchor = require("markdown-it-anchor")

module.exports = function (eleventyConfig) {

    eleventyConfig.addPassthroughCopy("src/**/*.jpg");
    eleventyConfig.addPassthroughCopy("src/**/*.png");
    eleventyConfig.addPassthroughCopy("src/**/*.webm");
    eleventyConfig.addPassthroughCopy("src/**/*.mp4");
    eleventyConfig.addPassthroughCopy("src/**/*.ttf");
    eleventyConfig.addPassthroughCopy("src/**/*.txt");
    eleventyConfig.addPassthroughCopy("src/**/*.css");
    eleventyConfig.addPassthroughCopy("src/**/*.svg");
    eleventyConfig.addPassthroughCopy("src/**/*.pdf");
    eleventyConfig.addPassthroughCopy("src/**/*.txt");

    const markdownItOptions = {
        html: true,
        linkify: true,
        typographer: true
    }

    eleventyConfig.setLibrary("md", markdownIt(markdownItOptions))


    return {
        dir: {
            input: "src"
        }
    }
};
