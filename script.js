const popup = document.getElementById("popup");
const popupBox = document.getElementById("popupBox");
const introVideo = document.getElementById("introVideo");
const playIntroBtn = document.getElementById("playIntroBtn");
const videoCaption = document.getElementById("videoCaption");
const mainContent = document.getElementById("mainContent");
const bgMusic = document.getElementById("bgMusic");
const mainMusic = document.getElementById("mainMusic");
const musicToggle = document.getElementById("musicToggle");
const performanceItems = document.querySelectorAll(".performance-item");
const performanceSpotlight = document.getElementById("performanceSpotlight");

const fadeElements = document.querySelectorAll(".scroll-fade");

const captionStartTime = 7;
const contentStartTime = 7;
const introFadeDuration = 2200;

let introPlayed = false;
let musicPlaying = false;
let captionShown = false;
let introFinished = false;
let scrollFadeTimer;
let scrollFadeFrame;
let currentPerformance = 0;
let performanceTimer;
let waitingForMainMusic = false;

function updateMusicButton() {
  if (!musicToggle) return;
  musicToggle.textContent = musicPlaying ? "🔊 Music On" : "🔇 Music Off";
}

async function playAudio(audio) {
  if (!audio) return false;

  try {
    await audio.play();
    return true;
  } catch (error) {
    console.log("Music gagal diputar:", error);
    return false;
  }
}

async function playMusic() {
  const shouldFinishIntroMusic = introFinished && waitingForMainMusic && bgMusic && !bgMusic.ended;
  const activeMusic = shouldFinishIntroMusic || !introFinished ? bgMusic : mainMusic;
  const inactiveMusic = activeMusic === bgMusic ? mainMusic : bgMusic;

  if (inactiveMusic) {
    inactiveMusic.pause();
    inactiveMusic.currentTime = 0;
  }

  musicPlaying = await playAudio(activeMusic);
  updateMusicButton();
}

function pauseMusic() {
  if (bgMusic) bgMusic.pause();
  if (mainMusic) mainMusic.pause();
  musicPlaying = false;
  updateMusicButton();
}

async function switchToMainMusic() {
  waitingForMainMusic = true;

  if (!musicPlaying) {
    updateMusicButton();
    return;
  }

  if (bgMusic && !bgMusic.ended) {
    updateMusicButton();
    return;
  }

  waitingForMainMusic = false;
  musicPlaying = await playAudio(mainMusic);
  updateMusicButton();
}

function showPerformance(index) {
  if (!performanceItems.length || !performanceSpotlight) return;

  currentPerformance = (index + performanceItems.length) % performanceItems.length;
  const activeItem = performanceItems[currentPerformance];
  const number = performanceSpotlight.querySelector(".performance-number");
  const title = performanceSpotlight.querySelector("h3");
  const copy = performanceSpotlight.querySelector("p");

  performanceItems.forEach((item, itemIndex) => {
    item.classList.toggle("active", itemIndex === currentPerformance);
  });

  if (number) number.textContent = activeItem.dataset.number;
  if (title) title.textContent = activeItem.dataset.title;
  if (copy) copy.textContent = activeItem.dataset.copy;
  if (activeItem.dataset.image) {
    performanceSpotlight.style.setProperty("--performance-image", `url("${activeItem.dataset.image}")`);
  }

  performanceSpotlight.classList.remove("is-changing");
  void performanceSpotlight.offsetWidth;
  performanceSpotlight.classList.add("is-changing");
}

function startPerformanceAutoPlay() {
  if (performanceItems.length < 2) return;

  clearInterval(performanceTimer);
  performanceTimer = setInterval(() => {
    showPerformance(currentPerformance + 1);
  }, 3600);
}

function showMainContent() {
  mainContent.classList.remove("hidden");
  mainContent.classList.add("intro-reveal");
  window.scrollTo(0, 0);

  setTimeout(() => {
    mainContent.classList.add("show");
  }, 80);
}

function updateNavVisibility() {
  document.body.classList.toggle("show-nav", window.scrollY > window.innerHeight * 0.35);
}

function updateSpotlightVisibility() {
  document.body.classList.toggle("spotlight-muted", window.scrollY > window.innerHeight * 0.95);
}

function finishIntro() {
  if (introFinished) return;
  introFinished = true;

  showMainContent();
  switchToMainMusic();
  popup.classList.add("fade-out");

  setTimeout(() => {
    if (introVideo) introVideo.pause();
    popup.style.display = "none";
  }, introFadeDuration);
}

function showVideoCaption() {
  if (!videoCaption || captionShown) return;
  captionShown = true;
  videoCaption.classList.remove("hidden");
  setTimeout(() => {
    videoCaption.classList.add("show");
  }, 80);
}

async function enterSite(withMusic) {
  if (introPlayed) return;
  introPlayed = true;

  popupBox.classList.add("hide");
  if (videoCaption) videoCaption.classList.remove("show");
  playIntroBtn.disabled = true;

  if (withMusic) {
    await playMusic();
  } else {
    pauseMusic();
  }

  try {
    introVideo.currentTime = 0;
    await introVideo.play();
  } catch (error) {
    console.log("Video gagal play:", error);
    finishIntro();
  }
}

playIntroBtn.addEventListener("click", () => enterSite(true));

if (introVideo) {
  introVideo.addEventListener("timeupdate", () => {
    if (introVideo.currentTime >= captionStartTime) {
      showVideoCaption();
    }

    if (introVideo.currentTime >= contentStartTime) {
      finishIntro();
    }
  });
  introVideo.addEventListener("ended", finishIntro);
  introVideo.addEventListener("error", finishIntro);
}

if (bgMusic) {
  bgMusic.addEventListener("ended", async () => {
    if (!introFinished || !waitingForMainMusic || !musicPlaying) return;

    waitingForMainMusic = false;
    musicPlaying = await playAudio(mainMusic);
    updateMusicButton();
  });
}

if (musicToggle) {
  musicToggle.addEventListener("click", async () => {
    if (musicPlaying) {
      pauseMusic();
    } else {
      await playMusic();
    }
  });
}

function resetScrollFade() {
  fadeElements.forEach((element) => {
    element.style.opacity = 1;
    element.style.transform = "none";
  });
}

performanceItems.forEach((item, itemIndex) => {
  item.addEventListener("click", () => {
    showPerformance(itemIndex);
    startPerformanceAutoPlay();
  });
});

function handleScrollFade() {
  const viewportHeight = window.innerHeight;

  fadeElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2;
    const distanceFromCenter = Math.abs(viewportHeight / 2 - elementCenter);

    let opacity = 1 - distanceFromCenter / (viewportHeight * 0.55);
    opacity = Math.max(0.18, Math.min(1, opacity));

    element.style.opacity = opacity;
    element.style.transform = "none";
  });
}

function handleScroll() {
  updateNavVisibility();
  updateSpotlightVisibility();

  if (!scrollFadeFrame) {
    scrollFadeFrame = requestAnimationFrame(() => {
      handleScrollFade();
      scrollFadeFrame = null;
    });
  }

  clearTimeout(scrollFadeTimer);
  scrollFadeTimer = setTimeout(resetScrollFade, 650);
}

window.addEventListener("scroll", handleScroll);
window.addEventListener("resize", resetScrollFade);
window.addEventListener("load", () => {
  updateMusicButton();
  showPerformance(0);
  startPerformanceAutoPlay();
  resetScrollFade();
  updateNavVisibility();
  updateSpotlightVisibility();
});
