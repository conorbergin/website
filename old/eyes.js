let dx = 0;
let dy = 0;
// let blink = 0;

const l_pupil = document.getElementById("pupil-0");
const r_pupil = document.getElementById("pupil-1");
const l_eye = document.getElementById("eye-0");
const r_eye = document.getElementById("eye-1");

const ls = JSON.parse(localStorage.getItem("cursorState"))
//

if (ls) {
    //const j = JSON.parse(ls);
    dx = ls.dx;
    dy = ls.dy;
} else {
    console.log(ls)
}

update_eyes(null)


function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}



function update_eyes(event) {
    const bbox = l_eye?.getBoundingClientRect() || r_eye?.getBoundingClientRect();
    dx = bbox.left + bbox.width / 2 - event?.clientX;
    dy = bbox.top + bbox.height / 2 - event?.clientY;

    const clamp_x = 200;
    const clamp_y = 200;

    const dx2 = clamp(dx, -clamp_x, clamp_x) / clamp_x
    const dy2 = clamp(dy, -clamp_y, clamp_y) / clamp_y

    const x_factor = 5;
    const y_factor = 5;

    //console.log(dx,dy)
    if (l_pupil) {
        l_pupil.style.transform = `translate(${-dx2*x_factor}px,${-dy2*y_factor}px)`
    }
    if (r_pupil) {
    r_pupil.style.transform =  `translate(${-dx2*x_factor}px,${-dy2*y_factor}px)`
        
    }

}

document.onpointermove = (event) => update_eyes(event)

document.onpointerdown = (event) => update_eyes(event)

window.addEventListener('beforeunload', () => {
    localStorage.setItem("cursorState", JSON.stringify({
        dx,
        dy,
    }))
})

// setInterval(blink, 5000);
