npx @11ty/eleventy --serve

# TODO
finish eye animation
move old content across
finish cad essay
add more bookmarks


# Style guide

Most things have a top level url ie `https://example.com/this/` or `https://example.com/the-other/` everything is lowercase and hyphens are the only delimeters, "cool urls don't change".

The website should work without javascript, javascript is not banned, but it shouldn't be used for navigation or displaying text. Use javascipt "islands".

Navigation should be done with a flexible and reconfigurable tag system, it should be easy to change the category of a page from one thing to another, pages should never change, nor should the sitemap, only the linking throughout the website.

# The Goblin

The current thinking is the goblin should be an svg and the eyes should be controlled with a transform and css variables

The pipeline is

1. Raster image is made with photoshop or similar, it should be 700px wide and however many px tall, say 100px.
2. The raster image will be converted to an svg with vtracer
3. the svg should be manually edited to insert the eyes, and wither the width or height shall be set.
4. the svg should be inseted into every header in the template.


# deps

make
python3
 - PIL
 - jinja2


