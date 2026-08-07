# Rendering Ink

For better or worse, we have decided to let our users draw on the screen.

There isn't a definitive way to implement this, raster programs like Photoshop or Gimp are well established, but there are also many vector based programs, and software that uses a combination both representations.

## Pixel representation

Gimp, Photoshop, or the venerable Microsoft Paint, work like this: A stamp, which is an image, is added to a canvas, another image, at regular intervals along the stroke input. Input parameters like pressure and tilt can be use to modify the stamp, and other parameters, such as jitter,  can be randomized. Instead of adding to the canvas, the stamp could apply some blending effect instead, such as blur. With this straight-forward representation, almost any image can be produced by a skilled artist, and because each stamp is an in-place change, it is not very compute intensive.

Below I have implemented a simple painting program, fiddle with the parameters and use a stylus if you have one. The source code is instructive, I have avoided using any of the potentially hardware accelerated canvas builtins and operate directly on the pixel buffer.

<select id="sel-brush">
  <option value="square" selected>Square</option>
  <option value="round">Round</option>
  <option value="bristle">Bristle</option>
  <option value="blend">Blend</option>
</select>
<select id="sel-color">
  <option value="#000000">Black</option>
  <option value="#ffffff">White</option>
  <option value="#e03232">Red</option>
  <option value="#ff8c00">Orange</option>
  <option value="#f0c800">Yellow</option>
  <option value="#28a428">Green</option>
  <option value="#2050d0">Blue</option>
  <option value="#8c28c8">Purple</option>
  <option value="#e05080">Pink</option>
  <option value="#785030">Brown</option>
</select>
<label>spacing <input id="input-spacing" type="number" min="1" max="50" value="20"></label>
<label>size <input id="input-size" type="number" min="1" max="50" value="10"></label>
<button id="btn-clear">clear</button>
<canvas id="canvas-1" width=692 height=300 style="display:block;background:white;border:1px solid black;cursor:crosshair;touch-action:none;">
</canvas>

<script type="module" src="./canvas-1.js"></script>

This architecture is wonderfully simple, and you can very quickly implement a diverse set of tools, but it has limitations, ones that may be grating considering the power of modern hardware: you much choose the size of the canvas before you begin, you can increase it's size afterwards, but you can't increase the fidelity of your work without some sort of AI upscaler. If you want your canvas to have good resolution, you will be working with 4k images, which are large, and if you have written a few lines of equations, or a simple sketch, you will still be using megabytes.

What if we used our raw input as our source of truth? Lets say we poll at 60Hz, and read coordinates and pressure as three 32-bit values, and we are only using the input half of the time, 60 * 3 * 4 * 0.5 = 360 bytes per second, or 1.3Mb per hour, not unreasonable. If we consider we get layers for free, haven't implemented compression, or any sort of deletion or garbage collection, it seem unlikely that this way of representing our data is going to be beaten on size by a raster format under normal circustances.

## Vector representation

If we represent our work with stroke data, there is no need to restrict ourselves to pixel coordinates, we can use floating points for everything. This means we don't need explicit canvas boundaries, and we can pan and zoom our viewport more than is reasonable for free.

## Stroke rendering

Coming up with a mathematically watertight way to describe the shape of a stroke is deceptively difficult. You might be tempted to treat the input points as a polyline, and find the left and right offsets of it, and fill this in, but this is surprisingly difficult.

An easier way is to say it is the swept area of the stamp along the path, this is in effect a continuous version of what happens in the raster approach we looked at first, and it maps well to what happens between real pen and paper.

If we store our strokes as lists of (x,y,pressure) tuples, each segment on the line should be the swept stamp from one point to the next.

The shape we need to draw looks like a conical capsule. This is simple enough that we can design an signed distance function, or SDF, to draw it. The way this is implemented is each capsule gets a bounding quad, which is passed to a fragment shader which evaluates the SDF pixel by pixel to draw the curves.

### Signed distance functions and fragment shaders

A signed distance function, SDF, is a function that describes a scalar field that is positive inside the shape and negative outside it (or the inverse, depending on convention), and zero at the boundary. The simplest example is a circle on the plane with radius $r$, centred at $(c_x,c_y)$:

$$f(x,y) = r - \sqrt{(x-c_x)^2 + (y-c_y)^2}$$

We can use this function to render a resolution independent circle, we simply evaluate the function for every pixel in our output image, if it is greater or equal to zero we colour it in, if it is less than zero we don't, or shade it with the background colour

Because each function invocation is independent, we can implement it as a fragment shader, and have the GPU evalute it in parallel.

The shape we actually need is the convex hull of two circles, which has a more complex SDF. I will try and keep the derivation brief.

<svg width=700 viewbox="-200 -200 700 400" style="background-color:white;">
  <circle cx="0" cy="0" fill="orange" r="25"/>
  <circle cx="130" cy="0" fill="orange" r="75"/>
  <path fill="orange" stroke="none" d="M-10 23 L 101 69 L 101 -69 L -10 -23 z"/>
  <path d="M-1000 0 L 2000 0" stroke="black" stroke-width="2" />
  <path d="M-25 0 a 25,25 0,0,1 50,0" stroke="black" stroke-width="2" fill="none"/>
  <path d="M-25 0 a 25,25 0,0,0 50,0" stroke="black" stroke-dasharray="2,2" stroke-width="2" fill="none"/>
  <path d="M55 0 a 75,75 0,0,1 150,0" stroke="black" stroke-width="2" fill="none"/>
  <path d="M55 0 a 75,75 0,0,0 150,0" stroke="black" stroke-dasharray="4,4" stroke-width="2" fill="none"/>
  <path d="M0 0 l -500 -1200" stroke="black" stroke-width="1.5"/>
  <path d="M130 0 l -500 -1200" stroke="black" stroke-width="1.5"/>
  <path d="M-65 0l 1200 -500" stroke="black" stroke-width="1.5" stroke-dasharray="1,1"/>
</svg>

We have two circles, located at points $p_0$ and $p_1$, with radii $r_0$ and $r_1$. We need to find the signed distance of the point $p$ from the boundary of the convex hull enclosing them.

In the case where one circle is inside the other, $|r1 - r0| <= |p1 - p0|$, we just return the signed distance for the larger circle (this also covers the case where the circles are the same).

<select id="sel-sdf-mode">
  <option value="capsule" selected>Capsule</option>
  <option value="circle">Circle</option>
</select>
<select id="sel-sdf-color">
  <option value="#000000">Black</option>
  <option value="#ffffff">White</option>
  <option value="#e03232">Red</option>
  <option value="#ff8c00">Orange</option>
  <option value="#f0c800">Yellow</option>
  <option value="#28a428">Green</option>
  <option value="#2050d0">Blue</option>
  <option value="#8c28c8">Purple</option>
</select>
<label>size <input id="input-sdf-size" type="number" min="1" max="30" value="10"></label>
<button id="btn-sdf-clear">clear</button>
<canvas id="canvas-sdf" width=692 height=300 style="display:block;background:white;border:1px solid black;cursor:crosshair;touch-action:none;"></canvas>

<script type="module" src="./canvas-2.js"></script>

### Tesselation

Our SDF method is simple, correct, and has acceptable performance. But GPUs are designed to render triangles, so we should consider trying to approximate our stroke shape with a list of triangles.

The simplest tesselation of a stroke is a series of quads. Each segment from $p_i$ to $p_{i+1}$ becomes a rectangle whose two long edges are parallel to the segment direction and whose width is determined by pressure. These quads are independent — adjacent segments share a point position but not a vertex, leaving visible gaps or overlaps at sharp turns.

<svg width="700" viewBox="-350 -200 700 400" style="background-color: white;" >
  <path d="M -40 -50 L -60 50" stroke="black" stroke-width="2"/>
  <path d="M 40 -50 L 60 50" stroke="black" stroke-width="2"/>
  <path d="M -40 -50 L 40 -50" stroke="black" stroke-width="2"/>
  <path d="M -60 50 L 60 50" stroke="black" stroke-width="2"/>
  <path d="M -60 -50 L 60 50" stroke="black" stroke-width="2" stroke-dasharray="2,2"/>
  <text x="-35" y="5">p<tspan dy="5" font-size="11">i+1</tspan></text>
  <rect x="-50" y="-10" width="5" height="5" fill="black"/>
  <rect x="50" y="10" width="5" height="5" fill="black"/>
</svg>

A better approach is to compute a miter join at each interior vertex: extend the edge lines of the two meeting segments until they intersect. The offset vertex at $\mathbf{p_i}$ becomes $\mathbf{p_i} \pm \frac{w}{\cos(\theta/2)} \hat{m}$, where $\hat{m}$ is the bisector of the two edge normals and $\theta$ is the turn angle. This makes the strip continuous with no gaps, at the cost of a spike at very sharp corners (mitigated in practice by a miter limit).

Both modes below use a single `TRIANGLE_STRIP` draw call per stroke.

<select id="sel-tess-mode">
  <option value="miter" selected>Miter</option>
  <option value="bevel">Bevel</option>
</select>
<select id="sel-tess-color">
  <option value="#000000">Black</option>
  <option value="#ffffff">White</option>
  <option value="#e03232">Red</option>
  <option value="#ff8c00">Orange</option>
  <option value="#f0c800">Yellow</option>
  <option value="#28a428">Green</option>
  <option value="#2050d0">Blue</option>
  <option value="#8c28c8">Purple</option>
</select>
<label>size <input id="input-tess-size" type="number" min="1" max="30" value="10"></label>
<button id="btn-tess-clear">clear</button>
<canvas id="canvas-tess" width=692 height=300 style="display:block;background:white;border:1px solid black;cursor:crosshair;touch-action:none;"></canvas>

<script type="module" src="./canvas-3.js"></script>

### Stroke simplification and curves

Our two GPU rendering strategies use every single input datum, and capture intent as best as we can. But not all datum are created equal, if we rest the stylus on the screen, generating a list of undulating pressure values, this is not adding anything to the drawing. If we remove some of the points we can reduce the size of the input arrays and also remove some of the noise, creating smooth strokes.

<select id="sel-svg-mode">
  <option value="miter" selected>Miter</option>
  <option value="bevel">Bevel</option>
</select>
<select id="sel-svg-color">
  <option value="#000000">Black</option>
  <option value="#ffffff">White</option>
  <option value="#e03232">Red</option>
  <option value="#ff8c00">Orange</option>
  <option value="#f0c800">Yellow</option>
  <option value="#28a428">Green</option>
  <option value="#2050d0">Blue</option>
  <option value="#8c28c8">Purple</option>
</select>
<label>size <input id="input-svg-size" type="number" min="1" max="50" value="10"></label>
<button id="btn-svg-clear">clear</button>
<svg width="700" height="400" id="canvas-svg" style="background-color:white;touch-action:none;user-select:none;cursor:crosshair;">
</svg>

<script type="module" src="./canvas-svg.js"></script>

# References

[1] Shen Ciao et al -  https://dl.acm.org/doi/epdf/10.1145/3641519.3657418

https://summergeometry.org/sgi2024/neural-shape-sweeping-with-signed-distance-functions/
https://www.shadertoy.com/view/NXsGR4
