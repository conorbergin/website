const videoContainer = document.getElementById("video-container");
const video1 = document.getElementById("video-1");
const video2 = document.getElementById("video-2");
videoContainer.onpointerdown = () => {
    if (video1.paused) {
        video1.play();
        video2.play();
    } else {
        video1.pause();
        video2.pause();
    }
}