---
layout: post.liquid
title: Centring the Cursor
date: 2024-03-11
tags: blog
---

I was watching a demonstration of Apple's new VR headset today and I noticed they were using a translucent grey dot as a cursor, the same as they use on the iPad when you attach an external trackpad. Will macOS eventually have a cursor like this?

My initial reaction would be that desktop OSes require more precision, they need a pixel precise pointer, whereas a touch interface can get away with this circular pointer as the buttons will all be bigger.

Is this true any more? My Gnome desktop (much to the chagrin of some people) has quite large UI elements and it works well on a touch screen. Most websites I visit are designed to be usable on phones and tablets. I would consider it bad design to have small UI elements because not only do they make using a touch screen impossible, they slow down your mouse movements.

If you look closely at the transitions between different cursor icons, you will see that the have different centres. You can test this below:

<div style="display:grid; grid-template-columns:1fr 1fr 1fr; border: 1px solid">
    <div style="border-bottom: 1px dashed; border-right: 1px dashed; padding:15px; cursor:default" >default</div>
    <div style="border-bottom: 1px dashed; border-right: 1px dashed; padding:15px; cursor:pointer" >pointer</div>
    <div style="border-bottom: 1px dashed;                           padding:15px; cursor:grab"    >grab</div>
    <div style="                           border-right: 1px dashed; padding:15px; cursor:move"    >move</div>
    <div style="                           border-right: 1px dashed; padding:15px; cursor:text"    >text</div>
    <div style="                                                     padding:15px; cursor:cell"    >cell</div>
</div>

The default arrow has its hot spot on its point, whereas the move cursor has its hot spot in its centre, and the grab cursor has no clear hot spot. Some of the hot spots are obscured and some aren't. Nothing here is logically consistent. I am not against the use of symbols, but I do find it a bit irritating the cursor will jump about as it transitions between cursor images with different hot spots.

## Hypothesis -- All cursors should be centred

Cursors are used for aiming, and they should follow the conventions of other things that are used for aiming. Video game crosshairs, sights on guns, rangefinders, all need some way of indicating the point of aim, and they usually do this with a cross, a dot or a circle. There are examples of scopes with chevrons or arrows pointing at the point of aim, but these are not as common. I suspect it is important for the optical centre of the reticle to match the point of aim. Furthermore, I suspect that when users click on buttons they place the cursor so its center of mass is in the centre of the button, not the tip. I have no data to back this up and am happy to be proved wrong.

Here are a few ideas 

<div style="display:grid; grid-template-columns:1fr 1fr 1fr; border: 1px solid">
    <div style="border-bottom: 1px dashed; border-right: 1px dashed; padding:15px; cursor:url(default.svg) 16 16, auto" >default</div>
    <div style="border-bottom: 1px dashed; border-right: 1px dashed; padding:15px; cursor:url(pointer.svg) 16 16, auto" >pointer</div>
    <div style="border-bottom: 1px dashed;                           padding:15px; cursor:url(grab.svg)    16 16, auto" >grab</div>
    <div style="                           border-right: 1px dashed; padding:15px; cursor:url(move.svg)    16 16, auto" >move</div>
    <div style="                           border-right: 1px dashed; padding:15px; cursor:url(text.svg)    16 16, auto" >text</div>
    <div style="                                                     padding:15px; cursor:url(cell.svg)    16 16, auto" >cell</div>
</div>

## Linux

I decided to try out my ideas on my Gnome desktop, and ended up going down a bit of a rabbit hole with the XCursor format, which is a binary that embeds bitmaps of various sizes and the desktop environment selects the image closest to your preferred size. I wanted to be able to define my cursors with SVG, so I used Rust to render SVGs of various sizes from my SVG files and compile them into XCursor binaries, [you can find the tool here](https://github.com/conorbergin/svg2xcursor/tree/main).

After using my own cursors for a few weeks I haven't noticed any drastic improvements in my clicking, but it is an interesting thing to mess around with. The mostly gray transparent cursors are good because you can clearly see whats underneath them. They do get lost over pure gray backgrounds, luckily there aren't too many of those. Having the cursor change colour based on the background would fix this, but this is not currently possible.

## Future Work

Cursor formats are very limited. Really an API, not an image format it required. I would like to be able to:

- Make the cursor colors change based on the colors of the screen below it
- Animate between different cursor shapes (like the iPadOS cursor)
- Change the text cursor height to the size of the text it is selecting (like the iPadOS cursor)
- Define my cursor as a vector graphic

All these things would have to be done in a new wayland protocol, and some might require changes in GUI libraries.