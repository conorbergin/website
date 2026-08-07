const canvas = document.getElementById("canvas-1");
let brush = document.getElementById("sel-brush");
let color = document.getElementById("sel-color");
let spacing = document.getElementById("input-spacing");
let size = document.getElementById("input-size");

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const ctx = canvas.getContext("2d");
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const buf = new Uint8ClampedArray(imageData.data.buffer);

function writePixel(x, y, r, g, b, a) {
  if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
    buf[4 * (y * canvas.width + x)] = r;
    buf[4 * (y * canvas.width + x) + 1] = g;
    buf[4 * (y * canvas.width + x) + 2] = b;
    buf[4 * (y * canvas.width + x) + 3] = a;
  }
}

function square(x, y, rad) {
  const [r, g, b] = hexToRgb(color.value);
  for (let i = -rad; i <= rad; i++) {
    for (let j = -rad; j <= rad; j++) {
      let u = x + i;
      let v = y + j;
      writePixel(u, v, r, g, b, 255);
    }
  }
}

function round(x, y, rad) {
  const [r, g, b] = hexToRgb(color.value);
  for (let i = -rad; i <= rad; i++) {
    for (let j = -rad; j <= rad; j++) {
      if (i * i + j * j <= rad * rad) {
        let u = x + i;
        let v = y + j;
        writePixel(u, v, r, g, b, 255);
      }
    }
  }
}

function blend(x, y, rad) {
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  let count = 0;
  for (let i = -rad; i <= rad; i++) {
    for (let j = -rad; j <= rad; j++) {
      if (i * i + j * j <= rad * rad) {
        const u = x + i;
        const v = y + j;
        r += buf[4 * (v * canvas.width + u)];
        g += buf[4 * (v * canvas.width + u) + 1];
        b += buf[4 * (v * canvas.width + u) + 2];
        a += buf[4 * (v * canvas.width + u) + 3];
        count++;
      }
    }
  }
  if (count > 0) {
    r /= count;
    g /= count;
    b /= count;
    a /= count;
  }
  for (let i = -rad; i <= rad; i++) {
    for (let j = -rad; j <= rad; j++) {
      if (i * i + j * j <= rad * rad) {
        const u = x + i;
        const v = y + j;
        writePixel(u, v, r, g, b, a);
      }
    }
  }
}

function bristle(x, y, rad) {
  const [r, g, b] = hexToRgb(color.value);
  const area = Math.PI * rad * rad;
  for (let n = 0; n < area * 0.4; n++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = Math.random() * rad;
    writePixel(
      Math.round(x + dist * Math.cos(angle)),
      Math.round(y + dist * Math.sin(angle)),
      r,
      g,
      b,
      255,
    );
  }
}

function stamp(x, y, rad) {
  switch (brush.value) {
    case "round":
      round(x, y, rad);
      break;
    case "blend":
      blend(x, y, rad);
      break;
    case "bristle":
      bristle(x, y, rad);
      break;
    default:
      square(x, y, rad);
  }
  ctx.putImageData(imageData, 0, 0);
}

function getPressure(e) {
  return e.pointerType === "pen" ? Math.max(0.05, e.pressure) : 0.5;
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.round((e.clientX - rect.left) * (canvas.width / rect.width)),
    y: Math.round((e.clientY - rect.top) * (canvas.height / rect.height)),
  };
}

document.getElementById("btn-clear").onclick = () => {
  buf.fill(0);
  ctx.putImageData(imageData, 0, 0);
};

canvas.onpointerdown = (e) => {
  let last_loc = getPos(e);
  stamp(last_loc.x, last_loc.y, Math.round(getPressure(e) * size.value));

  function move(event) {
    const loc = getPos(event);

    if (
      (loc.x - last_loc.x) ** 2 + (loc.y - last_loc.y) ** 2 >
        spacing.value ** 2 &&
      loc.x >= 0 &&
      loc.y >= 0 &&
      loc.x < canvas.width &&
      loc.y < canvas.height
    ) {
      stamp(loc.x, loc.y, Math.round(getPressure(event) * size.value));
      last_loc = loc;
    }
  }

  function up(event) {
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointermove", move);
  }
  document.addEventListener("pointerup", up);
  document.addEventListener("pointermove", move);
};
