const canvas = document.getElementById("canvas-sdf");
const modeEl = document.getElementById("sel-sdf-mode");
const colorEl = document.getElementById("sel-sdf-color");
const sizeEl = document.getElementById("input-sdf-size");

const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(1, 1, 1, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const vsSrc = `attribute vec2 a_pos;
uniform vec2 u_res;
uniform float u_zoom;
uniform vec2 u_pan;
varying vec2 v_world;
void main() {
  v_world = a_pos;
  vec2 screen = a_pos * u_zoom + u_pan;
  gl_Position = vec4(screen / u_res * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;
}`;

const fsSrc = `precision mediump float;
varying vec2 v_world;
uniform vec2 u_p0, u_p1;
uniform float u_r0, u_r1;
uniform vec3 u_color;
float sdf(in vec2 p, in vec2 p0, in vec2 p1, in float r0, in float r1) {
  vec2 ab = p1 - p0;
  float l = length(ab);
  if (abs(r1 - r0) > l) {
    return r0 > r1 ? length(p - p0) - r0 : length(p - p1) - r1;
  }
  vec2 dir = ab / l;
  vec2 ap = p - p0;
  float qx = abs(dot(ap, vec2(-dir.y, dir.x)));
  float qy = dot(ap, dir);
  float sina = (r0 - r1) / l;
  float cosa = sqrt(max(1.0 - sina * sina, 0.0));
  float k = cosa * qy - sina * qx;
  if (k < 0.0) return length(ap) - r0;
  if (k > cosa * l) return length(p - p1) - r1;
  return cosa * qx + sina * qy - r0;
}
void main() {
  float d = sdf(v_world, u_p0, u_p1, u_r0, u_r1);
  float a = 1.0 - smoothstep(-0.1, 0.1, d);
  if (a < 0.01) discard;
  gl_FragColor = vec4(u_color, a);
}`;

function makeShader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

const prog = gl.createProgram();
gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, vsSrc));
gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, fsSrc));
gl.linkProgram(prog);
gl.useProgram(prog);

const posBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
const aPos = gl.getAttribLocation(prog, "a_pos");
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

const uRes = gl.getUniformLocation(prog, "u_res");
const uP0 = gl.getUniformLocation(prog, "u_p0");
const uP1 = gl.getUniformLocation(prog, "u_p1");
const uR0 = gl.getUniformLocation(prog, "u_r0");
const uR1 = gl.getUniformLocation(prog, "u_r1");
const uCol = gl.getUniformLocation(prog, "u_color");
const uZoom = gl.getUniformLocation(prog, "u_zoom");
const uPan = gl.getUniformLocation(prog, "u_pan");
gl.uniform2f(uRes, canvas.width, canvas.height);

let zoom = 1.0,
  panX = 0,
  panY = 0;

function setView() {
  gl.uniform1f(uZoom, zoom);
  gl.uniform2f(uPan, panX, panY);
}
setView();

function hex01(hex) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

const segments = [];

function drawSegGL(p0, p1, r0, r1, rgb) {
  const pad = Math.max(r0, r1) + 1;
  const x0 = Math.min(p0[0], p1[0]) - pad,
    y0 = Math.min(p0[1], p1[1]) - pad;
  const x1 = Math.max(p0[0], p1[0]) + pad,
    y1 = Math.max(p0[1], p1[1]) + pad;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1]),
    gl.DYNAMIC_DRAW,
  );
  gl.uniform2fv(uP0, p0);
  gl.uniform2fv(uP1, p1);
  gl.uniform1f(uR0, r0);
  gl.uniform1f(uR1, r1);
  gl.uniform3fv(uCol, rgb);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function redraw() {
  setView();
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (const seg of segments) {
    drawSegGL(seg.p0, seg.p1, seg.r0, seg.r1, seg.rgb);
  }
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
  return [(sx - panX) / zoom, (sy - panY) / zoom];
}

function getPressure(e) {
  return e.pointerType === "pen" ? Math.max(0.05, e.pressure) : 0.5;
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  const pos = getPos(e);
  const r = getPressure(e) * sizeEl.value;
  const useCircles = modeEl.value === "circle";
  const col = hex01(colorEl.value);
  segments.push({ p0: pos, p1: pos, r0: r, r1: r, rgb: col });
  drawSegGL(pos, pos, r, r, col);
  let last = { pos, r };

  function move(e) {
    const p = getPos(e);
    const pr = getPressure(e) * sizeEl.value;
    const col = hex01(colorEl.value);
    if (useCircles) {
      segments.push({ p0: p, p1: p, r0: pr, r1: pr, rgb: col });
      drawSegGL(p, p, pr, pr, col);
    } else {
      segments.push({ p0: last.pos, p1: p, r0: last.r, r1: pr, rgb: col });
      drawSegGL(last.pos, p, last.r, pr, col);
    }
    last = { pos: p, r: pr };
  }

  function up() {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
  }
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 2) return;
  let lastX = e.clientX,
    lastY = e.clientY;

  function move(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    panX += (e.clientX - lastX) * scale;
    panY += (e.clientY - lastY) * scale;
    lastX = e.clientX;
    lastY = e.clientY;
    redraw();
  }

  function up() {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
  }
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
});

canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
    const factor = Math.pow(1.001, -e.deltaY);
    const newZoom = Math.min(10, Math.max(0.1, zoom * factor));
    panX = sx - (sx - panX) * (newZoom / zoom);
    panY = sy - (sy - panY) * (newZoom / zoom);
    zoom = newZoom;
    redraw();
  },
  { passive: false },
);

document.getElementById("btn-sdf-clear").onclick = () => {
  segments.length = 0;
  gl.clear(gl.COLOR_BUFFER_BIT);
};
