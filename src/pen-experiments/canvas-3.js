const canvas = document.getElementById("canvas-tess");
const modeEl = document.getElementById("sel-tess-mode");
const colorEl = document.getElementById("sel-tess-color");
const sizeEl = document.getElementById("input-tess-size");

const gl = canvas.getContext("webgl");
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(1, 1, 1, 1);

function mkShader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}
const prog = gl.createProgram();
gl.attachShader(
  prog,
  mkShader(
    gl.VERTEX_SHADER,
    `attribute vec2 a_pos; uniform vec2 u_res; uniform float u_zoom; uniform vec2 u_pan;
  void main() {
    vec2 screen = a_pos * u_zoom + u_pan;
    gl_Position = vec4(screen / u_res * 2.0 - 1.0, 0.0, 1.0);
    gl_Position.y *= -1.0;
  }`,
  ),
);
gl.attachShader(
  prog,
  mkShader(
    gl.FRAGMENT_SHADER,
    `precision mediump float; uniform vec3 u_col;
  void main() { gl_FragColor = vec4(u_col, 1.0); }`,
  ),
);
gl.linkProgram(prog);
gl.useProgram(prog);

const posBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
const aPos = gl.getAttribLocation(prog, "a_pos");
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
const uRes = gl.getUniformLocation(prog, "u_res");
const uCol = gl.getUniformLocation(prog, "u_col");
const uZoom = gl.getUniformLocation(prog, "u_zoom");
const uPan = gl.getUniformLocation(prog, "u_pan");
gl.uniform2f(uRes, canvas.width, canvas.height);

let zoom = 1.0, panX = 0, panY = 0;

function hex01(hex) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function norm(dx, dy) {
  const l = Math.hypot(dx, dy);
  return l > 1e-6 ? [dx / l, dy / l] : [1, 0];
}

function bevelVerts(pts) {
  const n = pts.length;
  const v = [];
  const push = (p, d, r) =>
    v.push(p.x - d[1] * r, p.y + d[0] * r, p.x + d[1] * r, p.y - d[0] * r);
  push(pts[0], norm(pts[1].x - pts[0].x, pts[1].y - pts[0].y), pts[0].r);
  for (let i = 1; i < n - 1; i++) {
    push(
      pts[i],
      norm(pts[i + 1].x - pts[i - 1].x, pts[i + 1].y - pts[i - 1].y),
      pts[i].r,
    );
  }
  push(
    pts[n - 1],
    norm(pts[n - 1].x - pts[n - 2].x, pts[n - 1].y - pts[n - 2].y),
    pts[n - 1].r,
  );
  return v;
}

function buildVerts(pts) {
  return new Float32Array(bevelVerts(pts));
}

const strokes = [];

function draw() {
  gl.uniform1f(uZoom, zoom);
  gl.uniform2f(uPan, panX, panY);
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (const s of strokes) {
    if (s.pts.length > 2) {
      const verts = buildVerts(s.pts);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
      gl.uniform3fv(uCol, s.color);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, verts.length / 2);
    }
  }
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
  return {
    x: (sx - panX) / zoom,
    y: (sy - panY) / zoom,
  };
}

function getPressure(e) {
  return e.pointerType === "pen" ? Math.max(0.05, e.pressure) : 0.5;
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  const pos = getPos(e);
  const r = getPressure(e) * sizeEl.value;
  const stroke = {
    pts: [{ ...pos, r }],
    color: hex01(colorEl.value),
    mode: modeEl.value,
  };
  strokes.push(stroke);
  draw();

  function move(e) {
    const p = getPos(e);
    p.r = getPressure(e) * sizeEl.value;
    stroke.pts.push(p);
    draw();
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
  let lastX = e.clientX, lastY = e.clientY;

  function move(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    panX += (e.clientX - lastX) * scale;
    panY += (e.clientY - lastY) * scale;
    lastX = e.clientX;
    lastY = e.clientY;
    draw();
  }

  function up() {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
  }
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
  const factor = Math.pow(1.001, -e.deltaY);
  const newZoom = Math.min(10, Math.max(0.1, zoom * factor));
  panX = sx - (sx - panX) * (newZoom / zoom);
  panY = sy - (sy - panY) * (newZoom / zoom);
  zoom = newZoom;
  draw();
}, { passive: false });

document.getElementById("btn-tess-clear").onclick = () => {
  strokes.length = 0;
  draw();
};
