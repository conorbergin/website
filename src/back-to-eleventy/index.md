---
layout: post.liquid
title: Back to Eleventy
tags: blog
date: 2025-03-30
---

My Sveltekit blog, despite its advantages, was making me uncomfortable. I had it set up to prerender every page, but it would still act as a single page app, replacing content when you navigated around. It also seemed to work with javascript disabled, I think it was intercepting links somehow. I was using mdsvex to render my markdown into svelte, and I had some custom svelte components embedded in it. I didn't entirely understand what was going on, but the website was very quick so I was initially happy with it. One of the primary reasons for doing this is I wanted my navigation to not repaint when you navigated around the blog, and I also wanted to do some interesting things with persistence across pages.

However all this was completely uneccessary for a small personal website, and it made me unsure about modifiying it. So I updated my old eleventy website, and found the differences in speed were really negligible, and I would get far more truck out of optimizing my images and embedded content. Any persistence I wanted between pages could be solved with local storage, and there was no longer any flashing between page loads, I think browsers have just got better at this, well Firefox has, I'm not sure Chrome ever had a problem. Also I now knew my website did not rely on javascript because it was primarily html with a few js scripts here and there, rather than a javascript application that could fall back on html.

Thats not to say I am entirely happy with eleventy, I am a bit confused about templating languages, several are supported, and I don't quite understand the mechanism by which they are selected and how they interact with each other, and the documentation is a bit spotty.

I had some idea of using the zig build system and my own markdown parser, then I would have no excuse for not understanding exactly how I was generating my html.

If html wasn't such an awful language for authoring I would happily do everything directly, but having to manually wrap every paragraph in ```<p></p>``` is just unacceptable.