'use strict';

const canvas  = document.getElementById('canvas');
const info    = document.getElementById('info');
const sizeEl  = document.getElementById('size');
const sizeVal = document.getElementById('size-val');

const W = 800, H = 600;
const BUF = 16 << 20; // 16 MB per buffer

canvas.width = W; canvas.height = H;

// ── State ─────────────────────────────────────────────────────────────────────

let device, ctx, fmt, uBuf, vBuf, iBuf, depthTex, tessPipeline, sdfBasicPipeline, sdfConePipeline, sdfLerpPipeline, bg;
let pan = { x: 0, y: 0 }, zoom = 1;
let strokes = [], active = null, gDirty = true;
let mode = 'tess', segCount = 0;
let maxW = 16;
let brushColor = [0.067, 0.067, 0.067]; // #111111

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

// ── WGSL ──────────────────────────────────────────────────────────────────────

const COMMON = `
struct U { pan: vec2f, scale: f32, _p: f32, size: vec2f, totalSegs: f32, _p2: f32 }
@group(0) @binding(0) var<uniform> u: U;
fn ndc(p: vec2f) -> vec4f {
  let s = (p * u.scale + u.pan) / u.size;
  return vec4f(s.x*2.0-1.0, 1.0-s.y*2.0, 0.0, 1.0);
}`;

// Pipeline A: CPU-tessellated quads. Vertex layout: vec2 pos, vec3 color (stride 20)
const TESS_WGSL = COMMON + `
struct Vo { @builtin(position) pos: vec4f, @location(0) color: vec3f }
@vertex fn vs(@location(0) p: vec2f, @location(1) color: vec3f) -> Vo {
  return Vo(ndc(p), color);
}
@fragment fn fs(v: Vo) -> @location(0) vec4f { return vec4f(v.color, 1.0); }
`;

// Pipelines B/C/D: SDF variants. Shared instance layout: p0, p1, r0, r1, color (stride 36)
const SDF_WGSL = COMMON + `
struct Vo {
  @builtin(position) pos: vec4f,
  @location(0) wp:    vec2f,
  @location(1) p0:    vec2f,
  @location(2) p1:    vec2f,
  @location(3) r0:    f32,
  @location(4) r1:    f32,
  @location(5) color: vec3f,
}
@vertex fn vs(
  @builtin(vertex_index) vi: u32,
  @builtin(instance_index) inst: u32,
  @location(0) p0: vec2f, @location(1) p1: vec2f,
  @location(2) r0: f32,   @location(3) r1: f32, @location(4) color: vec3f,
) -> Vo {
  let mn = vec2f(min(p0.x-r0, p1.x-r1), min(p0.y-r0, p1.y-r1));
  let mx = vec2f(max(p0.x+r0, p1.x+r1), max(p0.y+r0, p1.y+r1));
  let c  = array<vec2f,4>(vec2f(mn.x,mn.y), vec2f(mx.x,mn.y), vec2f(mx.x,mx.y), vec2f(mn.x,mx.y));
  let ix = array<u32,6>(0u,1u,2u, 0u,2u,3u);
  let wp = c[ix[vi]];
  let depth = f32(inst) / max(u.totalSegs - 1.0, 1.0);
  return Vo(vec4f(ndc(wp).xy, depth, 1.0), wp, p0, p1, r0, r1, color);
}
// B: uniform capsule — nearest-point t, constant radius r0
@fragment fn fs_basic(v: Vo) -> @location(0) vec4f {
  let ab = v.p1 - v.p0;
  let ap = v.wp - v.p0;
  let t  = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  let d  = length(ap - ab * t) - v.r0;
  let alpha = 1.0 - smoothstep(-1.5/u.scale, 1.5/u.scale, d);
  if alpha < 0.004 { discard; }
  return vec4f(v.color, alpha);
}

// C: exact tapered-cone SDF (IQ rounded-cone formula)
@fragment fn fs_cone(v: Vo) -> @location(0) vec4f {
  let ab  = v.p1 - v.p0;
  let l   = length(ab);
  var d : f32 = 0.0;
  if (abs(v.r1-v.r0) > l || l < 1e-6) {
    if (v.r0 > v.r1) { d = length(v.wp - v.p0) - v.r0; }
    else { d = length(v.wp - v.p1) - v.r1; }
  } else {
    let uv  = ab / l;
    let ap  = v.wp - v.p0;
    let qx  = abs(dot(ap, vec2f(-uv.y, uv.x)));
    let qy  = dot(ap, uv);
    let cb  = (v.r0 - v.r1) / l;
    let ca  = sqrt(max(1.0 - cb*cb, 0.0));
    let k   = ca * qy - cb * qx;
    if      k < 0.0    { d = length(ap) - v.r0; }
    else if k > ca * l { d = length(v.wp - v.p1) - v.r1; }
    else               { d = ca * qx + cb * qy - v.r0; }
  }
  let alpha = 1.0 - smoothstep(-1.5/u.scale, 1.5/u.scale, d);
  if alpha < 0.004 { discard; }
  return vec4f(v.color, alpha);
}

// D: nearest-point t, linearly interpolated radius
@fragment fn fs_lerp(v: Vo) -> @location(0) vec4f {
  let ab = v.p1 - v.p0;
  let ap = v.wp - v.p0;
  let t  = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  let d  = length(ap - ab * t) - (v.r0 + (v.r1 - v.r0) * t);
  let alpha = 1.0 - smoothstep(-1.5/u.scale, 1.5/u.scale, d);
  if alpha < 0.004 { discard; }
  return vec4f(v.color, alpha);
}
`;

// ── Geometry build ────────────────────────────────────────────────────────────
// Tess: 6 verts × 5 floats = 30 f32 per segment
// SDF:  9 floats per instance (p0.xy, p1.xy, r0, r1, color.rgb) — stride 36 bytes

function buildGeom() {
  const all   = active ? [...strokes, active] : strokes;
  const total = all.reduce((n, s) => n + Math.max(0, s.pts.length - 1), 0);
  const cap   = Math.min(total, Math.floor(BUF / (6 * 5 * 4))); // tess is tighter
  segCount    = cap;
  if (!cap) return;

  const tv = new Float32Array(cap * 30);
  const sv = new Float32Array(cap * 9);
  let ti = 0, si = 0, segs = 0;

  function vert(px, py, col) {
    tv[ti++] = px; tv[ti++] = py;
    tv[ti++] = col[0]; tv[ti++] = col[1]; tv[ti++] = col[2];
  }

  outer:
  for (let s = all.length - 1; s >= 0; s--) {
    const { pts, color, size } = all[s];
    for (let j = 0; j < pts.length - 1; j++) {
      if (segs >= cap) break outer;
      const a = pts[j], b = pts[j + 1];
      const r  = (a.p + b.p) * 0.5 * size;
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l * r, ny = dx / l * r;
      vert(a.x+nx, a.y+ny, color); vert(a.x-nx, a.y-ny, color); vert(b.x+nx, b.y+ny, color);
      vert(a.x-nx, a.y-ny, color); vert(b.x-nx, b.y-ny, color); vert(b.x+nx, b.y+ny, color);
      sv[si++]=a.x; sv[si++]=a.y; sv[si++]=b.x; sv[si++]=b.y;
      sv[si++]=a.p*size; sv[si++]=b.p*size;
      sv[si++]=color[0]; sv[si++]=color[1]; sv[si++]=color[2];
      segs++;
    }
  }

  device.queue.writeBuffer(vBuf, 0, tv, 0, segs * 30);
  device.queue.writeBuffer(iBuf, 0, sv, 0, segs * 9);
}

// ── Pointer events ────────────────────────────────────────────────────────────

function cp(e) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function wp([cx, cy]) { return [(cx - pan.x) / zoom, (cy - pan.y) / zoom]; }

let panning = false, panOrig, panStart;

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const c = cp(e), f = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  pan.x = c[0] - (c[0] - pan.x) * f;
  pan.y = c[1] - (c[1] - pan.y) * f;
  zoom *= f;
}, { passive: false });

canvas.addEventListener('pointerdown', e => {
  const c = cp(e);
  if (e.button === 1 || e.altKey) {
    panning = true; panOrig = c; panStart = { ...pan };
    canvas.setPointerCapture(e.pointerId); return;
  }
  if (e.button !== 0) return;
  const [wx, wy] = wp(c);
  active = { pts: [{ x: wx, y: wy, p: e.pressure || 0.5 }], color: [...brushColor], size: maxW };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', e => {
  const c = cp(e);
  if (panning) {
    pan.x = panStart.x + c[0] - panOrig[0];
    pan.y = panStart.y + c[1] - panOrig[1];
  } else if (active) {
    const evs = e.getCoalescedEvents?.() ?? [e];
    for (const ev of evs) {
      const [wx, wy] = wp(cp(ev));
      active.pts.push({ x: wx, y: wy, p: ev.pressure || 0.5 });
    }
    gDirty = true;
  }
});

canvas.addEventListener('pointerup', e => {
  if (panning) { panning = false; return; }
  if (active) { strokes.push(active); active = null; gDirty = true; }
});
canvas.addEventListener('pointercancel', () => { panning = false; active = null; });

// ── Controls ──────────────────────────────────────────────────────────────────

document.getElementById('btn-clear').onclick = () => {
  strokes = []; active = null; segCount = 0; gDirty = true;
};

document.getElementById('btn-stress').onclick = () => {
  for (let s = 0; s < 100; s++) {
    const pts  = [];
    const y0   = Math.random() * H, amp = 30 + Math.random() * 120, freq = 2 + Math.random() * 12;
    const h    = Math.random();
    // cheap HSV→RGB for vibrant random hues
    const i = Math.floor(h * 6), f = h * 6 - i, q = 1 - f;
    const rgb = [[1,f,0],[q,1,0],[0,1,f],[0,q,1],[f,0,1],[1,0,q]][i % 6].map(v => v * 0.75);
    for (let j = 0; j <= 200; j++) {
      const t = j / 200;
      pts.push({ x: t * W, y: y0 + Math.sin(t * Math.PI * freq) * amp, p: 0.1 + 0.9 * Math.abs(Math.sin(t * Math.PI * 5)) });
    }
    strokes.push({ pts, color: rgb, size: maxW });
  }
  gDirty = true;
};

document.querySelectorAll('input[name=pipeline]').forEach(r => { r.onchange = () => { mode = r.value; }; });

document.getElementById('color').oninput = e => { brushColor = hexToRgb(e.target.value); };

sizeEl.oninput = () => { maxW = +sizeEl.value; sizeVal.textContent = sizeEl.value; };

// ── Render loop ───────────────────────────────────────────────────────────────

function frame() {
  requestAnimationFrame(frame);

  if (gDirty) {
    buildGeom();
    gDirty = false;
    info.textContent = `${segCount.toLocaleString()} segs · ${strokes.length} strokes`;
  }

  device.queue.writeBuffer(uBuf, 0, new Float32Array([pan.x, pan.y, zoom, 0, W, H, segCount, 0]));

  const enc      = device.createCommandEncoder();
  const passDesc = {
    colorAttachments: [{
      view: ctx.getCurrentTexture().createView(),
      clearValue: [1, 1, 1, 1],
      loadOp: 'clear', storeOp: 'store',
    }],
  };
  if (mode !== 'tess') {
    passDesc.depthStencilAttachment = {
      view: depthTex.createView(),
      depthClearValue: 1.0, depthLoadOp: 'clear', depthStoreOp: 'discard',
    };
  }
  const pass = enc.beginRenderPass(passDesc);

  pass.setBindGroup(0, bg);
  if (segCount > 0) {
    if (mode === 'tess') {
      pass.setPipeline(tessPipeline);
      pass.setVertexBuffer(0, vBuf);
      pass.draw(segCount * 6);
    } else {
      pass.setPipeline(mode === 'sdf-cone' ? sdfConePipeline : mode === 'sdf-lerp' ? sdfLerpPipeline : sdfBasicPipeline);
      pass.setVertexBuffer(0, iBuf);
      pass.draw(6, segCount);
    }
  }

  pass.end();
  device.queue.submit([enc.finish()]);
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  if (!navigator.gpu) throw new Error('WebGPU not supported');
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('No WebGPU adapter');
  device = await adapter.requestDevice();
  fmt    = navigator.gpu.getPreferredCanvasFormat();
  ctx    = canvas.getContext('webgpu');
  ctx.configure({ device, format: fmt, alphaMode: 'opaque' });

  uBuf     = device.createBuffer({ size: 32,  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  vBuf     = device.createBuffer({ size: BUF, usage: GPUBufferUsage.VERTEX  | GPUBufferUsage.COPY_DST });
  iBuf     = device.createBuffer({ size: BUF, usage: GPUBufferUsage.VERTEX  | GPUBufferUsage.COPY_DST });
  depthTex = device.createTexture({ size: [W, H], format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT });

  const bgl = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }],
  });
  bg = device.createBindGroup({ layout: bgl, entries: [{ binding: 0, resource: { buffer: uBuf } }] });
  const pl = device.createPipelineLayout({ bindGroupLayouts: [bgl] });

  // Tessellated pipeline — vertex: vec2 pos + vec3 color, stride 20
  const tessM = device.createShaderModule({ code: TESS_WGSL });
  tessPipeline = device.createRenderPipeline({
    layout: pl,
    vertex: {
      module: tessM, entryPoint: 'vs',
      buffers: [{
        arrayStride: 20,
        attributes: [
          { shaderLocation: 0, offset:  0, format: 'float32x2' },
          { shaderLocation: 1, offset:  8, format: 'float32x3' },
        ],
      }],
    },
    fragment: { module: tessM, entryPoint: 'fs', targets: [{ format: fmt }] },
    primitive: { topology: 'triangle-list' },
  });

  // SDF pipelines B/C/D — shared instance layout: p0(8) p1(8) r0(4) r1(4) color(12), stride 36
  const sdfM = device.createShaderModule({ code: SDF_WGSL });
  const sdfVtxBufs = [{
    arrayStride: 36, stepMode: 'instance',
    attributes: [
      { shaderLocation: 0, offset:  0, format: 'float32x2' }, // p0
      { shaderLocation: 1, offset:  8, format: 'float32x2' }, // p1
      { shaderLocation: 2, offset: 16, format: 'float32'   }, // r0
      { shaderLocation: 3, offset: 20, format: 'float32'   }, // r1
      { shaderLocation: 4, offset: 24, format: 'float32x3' }, // color
    ],
  }];
  const sdfTarget = [{
    format: fmt,
    blend: {
      color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
      alpha: { srcFactor: 'one',       dstFactor: 'one-minus-src-alpha', operation: 'add' },
    },
  }];
  const makeSdf = ep => device.createRenderPipeline({
    layout: pl,
    vertex:       { module: sdfM, entryPoint: 'vs', buffers: sdfVtxBufs },
    fragment:     { module: sdfM, entryPoint: ep,   targets: sdfTarget },
    primitive:    { topology: 'triangle-list' },
    depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
  });
  sdfBasicPipeline = makeSdf('fs_basic');
  sdfConePipeline  = makeSdf('fs_cone');
  sdfLerpPipeline  = makeSdf('fs_lerp');

  requestAnimationFrame(frame);
}

init().catch(e => { info.textContent = '⚠ ' + e.message; console.error(e); });
