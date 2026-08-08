---
title: Dyson Award 2026
date: 2026-08-07
tags: blog
---


<video controls>
  <source src="https://cdn.cpbergin.com/dyson2026/input_nodes_dyson2026.mp4" type="video/mp4">
</video>

Above is the video from my submission to the James Dyson Award, there were a few posters to go with it but I don't think they were worth including.

The significant choice of the project is each module has a cheap CH32V003 RISC-V microcontroller which communicates with other modules over a digital protocol and interfaces with whatever input device is wired to it. Having a 32 bit CPU reading a button seems ridiculous, but at no point did I find myself limited by the power draw, size or cost of the chip, all my struggles were with the connectors between the modules. In it's current form, the connectors are too big, unreliable, and difficult to connect and disconnect.

I do like this idea, I was motivated by how difficult and expensive it is to make your own input devices and I wanted something where the parts were all reusable. If I could figure out a better way to do the connections it could be quite a neat little system.
