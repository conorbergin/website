---
layout: post.liquid
title: From Eleventy to SvelteKit
date: 2023-09-19
tags: blog
---

I started this website in the final year of my engineering degree. Up to this point my "areas of inquiry" had been esoteric operating systems and scientific computing, so I assumed web dev would be plain sailing.

## Eleventy

Slightly overwhelmed by all the paths I could take, I settled on static site generators. I looked at Eleventy and Hugo, going with Eleventy because it seemed more flexible. I would recommend starting with just HTML and CSS for someone in a similar position, it's much easier to understand the templating and data fetching a static site generator does if you understand what you are actually generating.

I was satisfied with Eleventy for some time, it had a few very useful features, such as being able to generate a date from the last edit of that file in the git repo. I could host it on Netlify and have it linked to my Github so that it rebuilt every time I pushed an update.

## A digression on GUI toolkits

Building a good GUI is difficult, and choosing from the the range of technologies available to you -- and considering the range of opinions you will see on each in various online communities -- does not make it any easier. The initial choice seems to be between a web app and a 'native' app, but the boundaries between the two are blurred.

At the lowest level we have drawing apis and libraries. Apple has Core Graphics, Windows has Direct2d. Browsers have HTML + CSS, SVG and Canvas. On Linux you typically use Cairo, Flutter uses Skia. And then there is nothing stopping you using a 3d api, Metal, DirectX, Vulkan, OpenGL, WebGL and WebGPU. The level of abstraction ranges from drawing triangles to text rendering.

Unless you want to make every text input, check-box and button from scratch you will need a Toolkit. If you want the best consistency with the target platform you can use whatever native toolkit it provides, but you will need to port your entire GUI layer for every new platform. Realistically, you will choose a cross-platform toolkit.

My current opinion is that if you are resource constrained and have no niche requirements you should be building a web app. You have mostly consistent rendering and layout, some 'native' widgets in the form of html input elements, and pretty good performance despite what you might read online. You can then bundle this app using Electron or Tauri and whatever is available for mobile platforms (cordova?), or just leave it as a website, most users won't care. There is also the PWA spec, which allows users to install your website as an app (a webview with no browser controls).

Choosing a webapp also opens up a world of excellent third party libraries, many more than you would find for any other platform. Modern reactive rendering libraries like React, Svelte or Solid make writing highly dynamic applications very easy. 


## SvelteKit

After using Svelte for a month or so I realized there was nothing stopping me from using it for my website as well. It would be no heavier, because of its compile step, and it would offer me a lot more flexibility. Actually the main reason I started using it was so the page wouldn't completely redraw when you were navigating the website. Once I installed a markdown preprocessor (mdsvex) I couldn't see any advantage in going back to Eleventy.

