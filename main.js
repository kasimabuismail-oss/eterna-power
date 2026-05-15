(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const video = document.querySelector(".hero-video");
  if (!video) {
    return;
  }

  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const applyMotion = () => {
    if (mq.matches) {
      video.pause();
      video.removeAttribute("autoplay");
      return;
    }
    const play = video.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => {});
    }
  };

  applyMotion();
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", applyMotion);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(applyMotion);
  }
})();
