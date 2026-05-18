(function () {
  const LOADER_MAX_MS = 12000;
  const LOADER_MIN_MS = 450;

  const initPageLoader = () => {
    const loader = document.getElementById("page-loader");
    if (!loader) {
      return;
    }

    const body = document.body;
    const video = document.querySelector(".hero-video");
    const logo = document.querySelector(".brand-logo");
    let finished = false;

    const wait = (ms) =>
      new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const waitForImage = (img) => {
      if (!img) {
        return Promise.resolve();
      }
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const done = () => {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          resolve();
        };
        img.addEventListener("load", done);
        img.addEventListener("error", done);
      });
    };

    const waitForVideo = (el) => {
      if (!el) {
        return Promise.resolve();
      }
      if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const done = () => {
          ["loadeddata", "canplay", "canplaythrough", "error"].forEach((evt) => {
            el.removeEventListener(evt, done);
          });
          resolve();
        };
        ["loadeddata", "canplay", "canplaythrough", "error"].forEach((evt) => {
          el.addEventListener(evt, done);
        });
      });
    };

    const fontsReady =
      document.fonts && typeof document.fonts.ready === "object"
        ? document.fonts.ready.catch(() => {})
        : Promise.resolve();

    const hideLoader = () => {
      if (finished) {
        return;
      }
      finished = true;
      loader.classList.add("is-hidden");
      loader.setAttribute("aria-busy", "false");
      body.classList.remove("is-loading");
      window.setTimeout(() => {
        loader.remove();
      }, 650);
    };

    const assetsReady = Promise.all([
      waitForVideo(video),
      waitForImage(logo),
      fontsReady,
    ]);

    Promise.race([assetsReady, wait(LOADER_MAX_MS)])
      .then(() => wait(LOADER_MIN_MS))
      .then(hideLoader);
  };

  initPageLoader();

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const video = document.querySelector(".hero-video");
  if (!video) {
    return;
  }

  // Re-assert the autoplay-friendly state as JS properties. Some browsers
  // (notably Safari) consult properties rather than attributes when deciding
  // whether a video is eligible for inline muted autoplay.
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
  video.autoplay = true;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const tryPlay = () => {
    if (reducedMotion.matches) {
      return;
    }
    if (!video.paused && !video.ended) {
      return;
    }
    const promise = video.play();
    if (promise && typeof promise.catch === "function") {
      // Swallow the rejection — we'll get another chance on a later event
      // (visibility change, user interaction, etc.) and retry then.
      promise.catch(() => {});
    }
  };

  // Kick playback right away, and retry as soon as the browser has any data.
  tryPlay();
  ["loadedmetadata", "loadeddata", "canplay", "canplaythrough"].forEach((evt) => {
    video.addEventListener(evt, tryPlay);
  });

  // If the browser auto-pauses (battery saver, background tab, etc.), resume.
  video.addEventListener("pause", () => {
    if (reducedMotion.matches || video.ended) {
      return;
    }
    setTimeout(tryPlay, 0);
  });

  // Resume on tab focus / page restore from bfcache.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      tryPlay();
    }
  });
  window.addEventListener("pageshow", tryPlay);
  window.addEventListener("focus", tryPlay);

  // Last-resort: kick playback on the first user interaction. Browsers that
  // block muted autoplay almost always permit playback after any gesture.
  const userEvents = ["pointerdown", "touchstart", "keydown", "scroll"];
  const onFirstInteraction = () => {
    tryPlay();
    userEvents.forEach((evt) => {
      window.removeEventListener(evt, onFirstInteraction, { capture: true });
    });
  };
  userEvents.forEach((evt) => {
    window.addEventListener(evt, onFirstInteraction, {
      capture: true,
      passive: true,
    });
  });

  const onReducedMotionChange = () => {
    if (reducedMotion.matches) {
      video.pause();
    } else {
      tryPlay();
    }
  };
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", onReducedMotionChange);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(onReducedMotionChange);
  }
})();
