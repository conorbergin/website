
let dx = 0;
let dy = 0;
// let blink = 0;

const l_pupil = document.getElementById("pupil-0");
const r_pupil = document.getElementById("pupil-1");
const l_eye = document.getElementById("eye-0");
const r_eye = document.getElementById("eye-1");

const lsKey = "cursorState"

const ls = JSON.parse(localStorage.getItem(lsKey));

if (ls) {
    dx = ls.dx;
    dy = ls.dy;
}

update_eyes()


function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}


const duration = 1000;

function blink() {
    [l_eye,r_eye].forEach((e) => e.setAttribute("transform","scale( 1 0.5)"))
    setTimeout(() => {
        [l_eye,r_eye].forEach((e) => e.setAttribute("transform","scale(1 0.1)"));
        setTimeout(() => {
            [l_eye,r_eye].forEach((e) => e.setAttribute("transform","scale(1 0.5)"))
            setTimeout(()=> {
                [l_eye,r_eye].forEach((e) => e.setAttribute("transform","scale(1 1)"))
            },duration)
        },duration)
    }, duration)
}


function update_eyes() {
    const dx2 = clamp(dx, -100, 100) / 100
    const dy2 = clamp(dy, -100, 100) / 100

    const x_factor = 3;
    const y_factor = 4;

    // console.log(dx,dy)
    l_pupil.setAttribute('transform', `translate(${-dx2*x_factor},${-dy2*y_factor})`)
    r_pupil.setAttribute('transform', `translate(${dx2*x_factor},${-dy2*y_factor})`)

}


document.onpointermove = (event) => {
    const bbox = eyes.getBoundingClientRect();
    dx = bbox.left + bbox.width / 2 - event.clientX;
    dy = bbox.top + bbox.height / 2 - event.clientY;

    update_eyes();
}


document.onpointerdown = (event) => {
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


