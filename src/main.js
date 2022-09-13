

const img = new Image();
img.src = '/Strandbeest/media/final-walker-sheet.webp';


const nFrames = 12;
const Width = 1250;
const Height = 644;


let running = false;
let x = 0;
let ctx;
let canvas;
let anim;


img.onload = () => { }
canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');
drawFrame();
drawPlay();

canvas.addEventListener('click', (e) => {
    if (running === false) {
        running = true;
        anim = play();
    } else {
        running = false;
        clearInterval(anim);
        drawPlay();

    }
})

function play() { return setInterval(drawFrame, 150); }

function drawFrame() {
    ctx.clearRect(0, 0, Width, Height);
    if (x == nFrames) { x = 0 };
    ctx.drawImage(img, -x * Width, 0);
    x += 1;
}

function drawPlay() {
    let offset_x = Math.floor(Width / 2);
    let offset_y = Math.floor(Height / 2);
    // let radius = 100;
    // let b = Math.floor(r/2);
    // let h = Math.floor(r*(Math.sqrt(3)/2));
    ctx.beginPath();
    ctx.lineTo(offset_x + 100, offset_y);
    ctx.lineTo(offset_x - 50, offset_y + 86);
    ctx.lineTo(offset_x - 50, offset_y - 86);
    ctx.fill();
}

function drawTriangle() {
    ctx.beginPath();
    ctx.moveTo(25, 25);
    ctx.lineTo(105, 25);
    ctx.lineTo(25, 105);
    ctx.fill();

    // Stroked triangle
    ctx.beginPath();
    ctx.moveTo(125, 125);
    ctx.lineTo(125, 45);
    ctx.lineTo(45, 125);
    ctx.closePath();
    ctx.stroke();
}


