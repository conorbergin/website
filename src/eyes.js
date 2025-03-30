
let dx = 0;
let dy = 0;
// let blink = 0;

const l_pupil = document.getElementById("l_pupil");
const r_pupil = document.getElementById("r_pupil");
const l_eye = document.getElementById("l_eye");
const r_eye = document.getElementById("r_eye");

const l_closed = document.getElementById("l_closed")
const r_closed = document.getElementById("r_closed")

const lsKey = "cursorState"

const ls = JSON.parse(localStorage.getItem(lsKey));

dx = ls.dx;
dy = ls.dy;

update_eyes()


function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}


function close() {
    // l_eye.style.visibility = "hidden"
    [l_eye, r_eye, l_pupil, r_pupil].forEach(e => e.style.visibility ="hidden");
    [l_closed, r_closed].forEach(e => e.style.visibility = "visible");
}

function open() {
    [l_eye, r_eye, l_pupil, r_pupil].forEach(e => e.style.visibility = "visible");
    [l_closed, r_closed].forEach(e => e.style.visibility = "hidden");
}

function blink() {
    close()
    setTimeout(open,300)
}


function update_eyes() {
    const dx2 = clamp(dx, -100, 100) / 100
    const dy2 = clamp(dy, -100, 100) / 100

    // console.log(dx,dy)
    l_pupil.setAttribute('cx', -dx2 / 6 - 0.5)
    l_pupil.setAttribute('cy', -dy2 / 6)

    r_pupil.setAttribute('cx', -dx2 / 6 + 0.5)
    r_pupil.setAttribute('cy', -dy2 / 6)
}


document.onpointermove = (event) => {
    const bbox = eyes.getBoundingClientRect();
    dx = bbox.left + bbox.width / 2 - event.clientX;
    dy = bbox.top + bbox.height / 2 - event.clientY;

    update_eyes();
}

window.addEventListener('beforeunload', () => {
    localStorage.setItem(lsKey, JSON.stringify({
        dx,
        dy,
    }))
})


// setInterval(blink, 5000);


