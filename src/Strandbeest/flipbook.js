Flipbook('final','media/final-walker-sheet.webp',1250,644,12,120);
Flipbook('prbm', 'media/prbm-sheet.webp',        850,850,6,240);
Flipbook('fem',  'media/fem-sheet.webp',         1095,1095,12,120);



function Flipbook(elementId, imgSrc, width, height, nFrames, speed) {
    const img = new Image();
    img.src = imgSrc;




    let dx = 0;

    let canvas = document.getElementById(elementId);
    let ctx = canvas.getContext('2d');

    img.onload = () => {
        let running = false;
        let anim;

        drawFrame();
        drawPlay();

        canvas.addEventListener('click', () => {
            if (running === false) {
                running = true;
                anim = setInterval(drawFrame, speed);
            } else {
                running = false;
                clearInterval(anim);
                drawPlay();
            }
        })
    }

    function drawFrame() {
        ctx.clearRect(0, 0, width, height);
        if (dx == nFrames) { dx = 0 };
        ctx.drawImage(img, -dx * width, 0);
        dx += 1;
    }

    function drawPlay() {
        let sf = canvas.scrollHeight / canvas.height;
        let offset_x = Math.floor(30 / sf);
        let offset_y = Math.floor(40 / sf);
        ctx.beginPath();
        ctx.lineTo(offset_x + Math.floor(20/sf), offset_y);
        ctx.lineTo(offset_x - Math.floor(10/sf), offset_y + Math.floor(17/sf));
        ctx.lineTo(offset_x - Math.floor(10/sf), offset_y - Math.floor(17/sf));
        ctx.fill();
    }
}
