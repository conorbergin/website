let clear = document.getElementById("btn-svg-clear");
let size = document.getElementById("input-svg-size");
let color = document.getElementById("sel-svg-color");
let canvas = document.getElementById("canvas-svg");

let strokes = [];
let zoom = 1,
  panX = 0,
  panY = 0;

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  return { x: (sx - panX) / zoom, y: (sy - panY) / zoom };
}

function processPoints(
  rawPoints,
  { size = 16, streamline = 0.5, minDist = 1 } = {},
) {
  if (rawPoints.length === 0) return [];

  const result = [];
  let prevPoint = [rawPoints[0].x, rawPoints[0].y];
  let runningLength = 0;

  for (let i = 0; i < rawPoints.length; i++) {
    const { x, y, pressure = 0.5 } = rawPoints[i];
    const point =
      i === 0
        ? [x, y]
        : [
            prevPoint[0] + (x - prevPoint[0]) * (1 - streamline),
            prevPoint[1] + (y - prevPoint[1]) * (1 - streamline),
          ];

    const dx = point[0] - prevPoint[0];
    const dy = point[1] - prevPoint[1];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (i > 0 && distance < minDist) continue;

    runningLength += distance;
    result.push({
      point,
      pressure,
      vector: distance > 0 ? [dx / distance, dy / distance] : [1, 0],
      distance,
      runningLength,
    });
    prevPoint = point;
  }

  return result;
}

const MIN_RADIUS = 0.01;
const END_NOISE_THRESHOLD = 3;
const CORNER_CAP_SEGMENTS = 8;
const FIXED_PI = Math.PI;

function getStrokeOutlinePoints(points, options = {}) {
  const {
    size = 16,
    smoothing = 0.5,
    thinning = 0.5,
    simulatePressure: shouldSimulatePressure = true,
    easing = (t) => t,
    start = {},
    end = {},
    last: isComplete = false,
  } = options;

  const {
    cap: capStart = true,
    taper: taperStartDist = 0,
    easing: taperStartEase = (t) => t * (2 - t),
  } = start;

  const {
    cap: capEnd = true,
    taper: taperEndDist = 0,
    easing: taperEndEase = (t) => --t * t * t + 1,
  } = end;

  if (points.length === 0 || size <= 0) return [];

  const totalLength = points.at(-1).runningLength;
  const taperStart = computeTaperDistance(taperStartDist, size, totalLength);
  const taperEnd = computeTaperDistance(taperEndDist, size, totalLength);
  const minDistance = (size * smoothing) ** 2;

  const { leftPts, rightPts, firstRadius, radius } = collectOutlinePoints(
    points,
    {
      size,
      thinning,
      smoothing: minDistance,
      easing,
      simulatePressure: shouldSimulatePressure,
      taperStart,
      taperEnd,
      taperStartEase,
      taperEndEase,
      totalLength,
    },
  );

  const firstPt = points[0].point;
  const lastPt = points.length > 1 ? points.at(-1).point : add(firstPt, [1, 1]);

  if (points.length === 1) {
    if (!(taperStart || taperEnd) || isComplete)
      return drawDot(firstPt, firstRadius ?? radius);
    return [];
  }

  const startCap = buildStartCap(
    firstPt,
    leftPts[0],
    rightPts[0],
    taperStart,
    taperEnd,
    capStart,
  );
  const endCap = buildEndCap(
    lastPt,
    points.at(-1).vector,
    radius,
    taperStart,
    taperEnd,
    capEnd,
    points.length,
  );

  return [...leftPts, ...endCap, ...rightPts.reverse(), ...startCap];
}

function collectOutlinePoints(points, opts) {
  const {
    size,
    thinning,
    smoothing: minDistance,
    easing,
    simulatePressure,
    taperStart,
    taperEnd,
    taperStartEase,
    taperEndEase,
    totalLength,
  } = opts;

  const leftPts = [];
  const rightPts = [];

  let prevPressure = computeInitialPressure(points, simulatePressure, size);
  let radius = getStrokeRadius(size, thinning, points.at(-1).pressure, easing);
  let firstRadius;
  let prevVector = points[0].vector;
  let prevLeft = points[0].point;
  let prevRight = prevLeft;
  let isPrevSharp = false;

  for (let i = 0; i < points.length; i++) {
    const { point, vector, distance, pressure, runningLength } = points[i];
    const isLast = i === points.length - 1;

    if (!isLast && totalLength - runningLength < END_NOISE_THRESHOLD) continue;

    // --- radius ---
    if (thinning) {
      const p = simulatePressure
        ? computeSimulatedPressure(prevPressure, distance, size)
        : pressure;
      radius = getStrokeRadius(size, thinning, p, easing);
    } else {
      radius = size / 2;
    }
    firstRadius ??= radius;

    // --- taper ---
    const ts =
      runningLength < taperStart
        ? taperStartEase(runningLength / taperStart)
        : 1;
    const te =
      totalLength - runningLength < taperEnd
        ? taperEndEase((totalLength - runningLength) / taperEnd)
        : 1;
    radius = Math.max(MIN_RADIUS, radius * Math.min(ts, te));

    // --- sharp corner ---
    const nextVector = (isLast ? points[i] : points[i + 1]).vector;
    const nextDpr = isLast ? 1 : dot(vector, nextVector);
    const isSharp = dot(vector, prevVector) < 0 && !isPrevSharp;
    const isNextSharp = nextDpr < 0;

    if (isSharp || isNextSharp) {
      const offset = mul(per(prevVector), radius);
      const step = 1 / CORNER_CAP_SEGMENTS;
      for (let t = 0; t <= 1; t += step) {
        leftPts.push(rotAround(sub(point, offset), point, FIXED_PI * t));
        rightPts.push(rotAround(add(point, offset), point, FIXED_PI * -t));
      }
      prevLeft = leftPts.at(-1);
      prevRight = rightPts.at(-1);
      isPrevSharp = isNextSharp;
      continue;
    }

    isPrevSharp = false;

    // --- last point ---
    if (isLast) {
      const offset = mul(per(vector), radius);
      leftPts.push(sub(point, offset));
      rightPts.push(add(point, offset));
      continue;
    }

    // --- regular point ---
    const offset = mul(per(lerp(nextVector, vector, nextDpr)), radius);

    const tl = sub(point, offset);
    if (i <= 1 || dist2(prevLeft, tl) > minDistance) {
      leftPts.push(tl);
      prevLeft = tl;
    }

    const tr = add(point, offset);
    if (i <= 1 || dist2(prevRight, tr) > minDistance) {
      rightPts.push(tr);
      prevRight = tr;
    }

    prevPressure = pressure;
    prevVector = vector;
  }

  return { leftPts, rightPts, firstRadius, radius };
}

const add = ([ax, ay], [bx, by]) => [ax + bx, ay + by];
const sub = ([ax, ay], [bx, by]) => [ax - bx, ay - by];
const mul = ([x, y], s) => [x * s, y * s];
const per = ([x, y]) => [y, -x]; // perpendicular
const dot = ([ax, ay], [bx, by]) => ax * bx + ay * by;
const dist2 = ([ax, ay], [bx, by]) => (ax - bx) ** 2 + (ay - by) ** 2;
const lerp = ([ax, ay], [bx, by], t) => [
  ax + (bx - ax) * t,
  ay + (by - ay) * t,
];

function rotAround([x, y], [cx, cy], angle) {
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  return [
    cos * (x - cx) - sin * (y - cy) + cx,
    sin * (x - cx) + cos * (y - cy) + cy,
  ];
}

function computeTaperDistance(taper, size, totalLength) {
  if (taper === true) return Math.max(size, totalLength);
  if (!taper) return 0;
  return taper;
}

function computeInitialPressure(points, simulatePressure, size) {
  return points.slice(0, 10).reduce((acc, curr) => {
    if (!simulatePressure) return curr.pressure;
    const sp = Math.min(1, curr.distance / size);
    const rp = Math.min(1, 1 - sp);
    return Math.min(1, acc + (rp - acc) * (sp * 0.275));
  }, 0.5);
}

function getStrokeRadius(size, thinning, pressure, easing) {
  return size * easing(0.5 - thinning * (0.5 - pressure));
}

function computeSimulatedPressure(prevPressure, distance, size) {
  const sp = Math.min(1, distance / size);
  const rp = Math.min(1, 1 - sp);
  return Math.min(1, prevPressure + (rp - prevPressure) * (sp * 0.275));
}

function drawDot(center, radius) {
  const n = CORNER_CAP_SEGMENTS * 2;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [center[0] + Math.cos(a) * radius, center[1] + Math.sin(a) * radius];
  });
}

function buildStartCap(
  firstPt,
  _leftFirst,
  rightFirst,
  taperStart,
  _taperEnd,
  capStart,
) {
  if (taperStart) return [firstPt];
  if (capStart) {
    const step = 1 / CORNER_CAP_SEGMENTS;
    const cap = [];
    for (let t = 0; t <= 1; t += step) {
      cap.push(rotAround(rightFirst, firstPt, FIXED_PI * -t));
    }
    return cap;
  }
  return [firstPt];
}

function buildEndCap(
  lastPt,
  vector,
  radius,
  _taperStart,
  taperEnd,
  capEnd,
  _pointsLength,
) {
  if (taperEnd) return [lastPt];
  if (capEnd) {
    const step = 1 / CORNER_CAP_SEGMENTS;
    const cap = [];
    const leftEnd = sub(lastPt, mul(per(vector), radius));
    for (let t = 0; t < 1; t += step) {
      cap.push(rotAround(leftEnd, lastPt, FIXED_PI * -t));
    }
    return cap;
  }
  return [lastPt];
}

function strokeToSvgPath(points) {
  if (points.length === 0) return "";

  const d =
    points
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`,
      )
      .join(" ") + " Z";
  return `<path d="${d}" stroke="currentColor" fill="none"/>`;
}

function draw() {
  const paths = strokes
    .map((stroke) => {
      const sz = Number(stroke.width);
      const pts = processPoints(stroke.points, { size: sz, minDist: 1 / zoom });
      const outline = getStrokeOutlinePoints(pts, {
        size: sz,
        smoothing: 0.5 / zoom,
        simulatePressure: stroke.simulatePressure,
      });
      return `<g style="color:${stroke.color}">${strokeToSvgPath(outline)}</g>`;
    })
    .join("");
  canvas.innerHTML = `<g transform="translate(${panX},${panY}) scale(${zoom})">${paths}</g>`;
}

function getPressure(e) {
  return e.pointerType === "pen" ? Math.max(0.05, e.pressure) : 0.5;
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  const pos = getPos(e);
  strokes.push({
    width: size.value,
    color: color.value,
    simulatePressure: e.pointerType !== "pen",
    points: [{ ...pos, pressure: getPressure(e) }],
  });
  draw();

  function onMove(e) {
    strokes.at(-1).points.push({ ...getPos(e), pressure: getPressure(e) });
    draw();
  }

  function onUp() {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
  }

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 2) return;
  let lastX = e.clientX,
    lastY = e.clientY;

  function onMove(e) {
    panX += e.clientX - lastX;
    panY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    draw();
  }

  function onUp() {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
  }

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
});

canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const factor = Math.pow(1.001, -e.deltaY);
    const newZoom = Math.min(10, Math.max(0.1, zoom * factor));
    panX = sx - (sx - panX) * (newZoom / zoom);
    panY = sy - (sy - panY) * (newZoom / zoom);
    zoom = newZoom;
    draw();
  },
  { passive: false },
);

clear.onclick = () => {
  strokes = [];
  draw();
};
