---
layout: post.liquid
title: Back to Eleventy
tags: blog
date: 2025-03-30
---

My Sveltekit blog, despite its advantages, was making me uncomfortable. I had done a bunch of things to get it to work like a typical Static Site Generator: Markdown, tags, prerendered html, etc. And I was afraid of touching it.

I was attracted to this setup, from Eleventy, because it was slightly faster. Svelte is a rendering library, so it can modify the html and the url without actually making a new http request, the whole blog is an spa. But I was rendering all the endpoints, so it was loading prerendered html when you first visited my site. And if you disabled Javascript in your browser, it still worked? How I don't know, I don't think this works with any other rendering library.

However all this was completely uneccessary for a small personal website, and it made me unsure about modifiying it. So I updated my old eleventy website, and found the differences in speed were really negligible, and I would get far more truck out of optimizing my images and embedded content. Any persistence I wanted between pages could be solved with local storage, and there was no longer any flashing between page loads, I think browsers have just got better at this, well Firefox has, I'm not sure Chrome ever had a problem. Also I now knew my website did not rely on javascript because it was primarily html with a few js scripts here and there, rather than a javascript application that could fall back on html.

Thats not to say I am happy with Eleventy, the project is badly documented, an a lot of the features are janky. Part of this has to do with Eleventy being so flexible, its very easy to accidentally copy your source into your output with `passThroughCopy` for example.

If html wasn't such an awful language for authoring I would happily do everything directly, but having to manually wrap every paragraph in ```<p></p>``` is just unacceptable.

I did breifly try Zola, I like the idea of a self contained binary that does everything, but it wasnt't as flexible as Eleventy, and reconfiguring websites is an extraordinary timesink.

## What have we learned?

Nothing really, next time I update my website I will probably end up writing my own SSG,and I am confident I will regret doing it.
