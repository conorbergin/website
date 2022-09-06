

const mathjaxPlugin = require("eleventy-plugin-mathjax");

module.exports = function(eleventyConfig) {
    
    eleventyConfig.addPassthroughCopy("src/**/*.jpg");
    eleventyConfig.addPassthroughCopy("src/**/*.png");
    eleventyConfig.addPassthroughCopy("src/**/*.webm");
    eleventyConfig.addPassthroughCopy("src/**/*.mp4");
    eleventyConfig.addPassthroughCopy("src/**/*.ttf");
    eleventyConfig.addPassthroughCopy("src/**/*.txt");
    eleventyConfig.addPassthroughCopy("src/**/*.css");
    eleventyConfig.addPassthroughCopy("src/**/*.svg");
    eleventyConfig.addPassthroughCopy("src/**/*.pdf");

    return {
        dir: {
            input: "src"
        }
    }
};
