/* ============================================================
   MEPANDES CEREMONY INVITATION — SCRIPTS
   ============================================================ */

(function () {
  "use strict";

  /* ===== CONFIGURATION ===== */
  const CONFIG = {
    ceremonyDate: new Date("2026-02-17T03:00:00+08:00"),
    animationDelay: 150,
    musicSrc: "assets/Ratu Anom - Balinese Instrumental - Sugi Art.mp3",
    isAdmin:
      new URLSearchParams(window.location.search).get("admin") === "true",
  };

  /* ===== DOM REFERENCES ===== */
  const DOM = {
    cover: document.getElementById("cover"),
    btnOpen: document.getElementById("btnOpen"),
    invitation: document.getElementById("invitation"),
    audioToggle: document.getElementById("audioToggle"),
    countdownTimer: document.getElementById("countdownTimer"),
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds"),
    rsvpForm: document.getElementById("rsvpForm"),
    btnSubmit: document.getElementById("btnSubmit"),
    wishesContainer: document.getElementById("wishesContainer"),
    guestName: document.getElementById("guestName"),
  };

  /* ===== GUEST NAME FROM URL ===== */
  function setGuestName() {
    const params = new URLSearchParams(window.location.search);
    const guest = params.get("to") || params.get("guest") || params.get("nama");
    if (guest) {
      DOM.guestName.textContent = decodeURIComponent(guest);
    }
  }

  /* ===== COVER OPEN ===== */
  function openInvitation() {
    DOM.cover.classList.add("closing");

    setTimeout(() => {
      DOM.cover.style.display = "none";
      DOM.invitation.classList.remove("hidden");

      // Allow body scrolling
      document.body.style.overflow = "";

      // Initialize scroll animations after invitation is visible
      initScrollAnimations();

      // Start countdown
      startCountdown();

      // Auto-play background music
      playMusic();
    }, 800);
  }

  /* ===== BACKGROUND MUSIC ===== */
  let bgMusic = null;
  let isMusicPlaying = false;

  function initMusic() {
    bgMusic = new Audio(CONFIG.musicSrc);
    bgMusic.loop = true;
    bgMusic.volume = 0.9;
  }

  function playMusic() {
    if (!bgMusic) initMusic();
    bgMusic
      .play()
      .then(() => {
        isMusicPlaying = true;
        DOM.audioToggle.classList.add("playing");
      })
      .catch(() => {
        // Autoplay blocked — user can click toggle
        isMusicPlaying = false;
        DOM.audioToggle.classList.remove("playing");
      });
  }

  function toggleMusic() {
    if (!bgMusic) initMusic();
    if (isMusicPlaying) {
      bgMusic.pause();
      isMusicPlaying = false;
      DOM.audioToggle.classList.remove("playing");
    } else {
      bgMusic.play().then(() => {
        isMusicPlaying = true;
        DOM.audioToggle.classList.add("playing");
      });
    }
  }

  /* ===== COUNTDOWN TIMER ===== */
  let countdownInterval;

  function startCountdown() {
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  function updateCountdown() {
    const now = new Date().getTime();
    const target = CONFIG.ceremonyDate.getTime();
    const diff = target - now;

    if (diff <= 0) {
      DOM.days.textContent = "00";
      DOM.hours.textContent = "00";
      DOM.minutes.textContent = "00";
      DOM.seconds.textContent = "00";
      clearInterval(countdownInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    DOM.days.textContent = String(days).padStart(2, "0");
    DOM.hours.textContent = String(hours).padStart(2, "0");
    DOM.minutes.textContent = String(minutes).padStart(2, "0");
    DOM.seconds.textContent = String(seconds).padStart(2, "0");
  }

  /* ===== SCROLL ANIMATIONS (IntersectionObserver) ===== */
  function initScrollAnimations() {
    const fadeElements = document.querySelectorAll(".fade-in");

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                entry.target.classList.add("visible");
              }, index * CONFIG.animationDelay);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.15,
          rootMargin: "0px 0px -50px 0px",
        },
      );

      fadeElements.forEach((el) => observer.observe(el));
    } else {
      // Fallback for older browsers
      fadeElements.forEach((el) => el.classList.add("visible"));
    }
  }

  /* ===== AUDIO TOGGLE ===== */
  let isPlaying = false;

  function toggleAudio() {
    isPlaying = !isPlaying;
    DOM.audioToggle.classList.toggle("playing", isPlaying);

    // If you want to add actual audio, uncomment and add your audio file:
    // if (!audio) {
    //     audio = new Audio('assets/music.mp3');
    //     audio.loop = true;
    // }
    // isPlaying ? audio.play() : audio.pause();
  }

  /* ===== RSVP FORM ===== */
  const wishes = loadWishes();

  function handleRSVP(e) {
    e.preventDefault();

    const name = document.getElementById("rsvpName").value.trim();
    const attendance = document.getElementById("rsvpAttendance").value;
    const message = document.getElementById("rsvpMessage").value.trim();

    if (!name || !attendance) return;

    // Build wish object
    const wish = {
      id: Date.now(),
      name,
      attendance,
      guests: 1,
      message,
      time: new Date().toLocaleString("id-ID"),
    };

    // Save to local storage
    wishes.unshift(wish);
    saveWishes(wishes);

    // Add to UI
    addWishToDOM(wish);

    // Show success
    const originalText = DOM.btnSubmit.textContent;
    DOM.btnSubmit.textContent = "✓ Terkirim!";
    DOM.btnSubmit.classList.add("success");

    setTimeout(() => {
      DOM.btnSubmit.textContent = originalText;
      DOM.btnSubmit.classList.remove("success");
    }, 2500);

    // Reset form
    DOM.rsvpForm.reset();
  }

  function addWishToDOM(wish) {
    const wishEl = document.createElement("div");
    wishEl.className = "wish-item";
    wishEl.dataset.id = wish.id;

    const statusText =
      wish.attendance === "hadir" ? `✓ Akan Hadir` : "✗ Tidak Bisa Hadir";

    // Get initials (up to 2 chars from first words)
    const initials = wish.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");

    wishEl.innerHTML = `
            ${CONFIG.isAdmin ? '<button class="wish-delete" title="Hapus ucapan">&times;</button>' : ""}
            <div class="wish-avatar">${initials}</div>
            <div class="wish-body">
              <div class="wish-header">
                <span class="wish-name">${escapeHTML(wish.name)}</span>
                <span class="wish-status">${statusText}</span>
              </div>
              ${wish.message ? `<div class="wish-message">"${escapeHTML(wish.message)}"</div>` : ""}
            </div>
        `;

    // Attach delete handler (admin only)
    if (CONFIG.isAdmin) {
      wishEl.querySelector(".wish-delete").addEventListener("click", () => {
        deleteWish(wish.id, wishEl);
      });
    }

    DOM.wishesContainer.prepend(wishEl);
  }

  function deleteWish(id, el) {
    if (!confirm("Hapus ucapan ini?")) return;

    // Remove from array
    const idx = wishes.findIndex((w) => w.id === id);
    if (idx !== -1) wishes.splice(idx, 1);
    saveWishes(wishes);

    // Animate out then remove from DOM
    el.style.transition = "all 0.3s ease";
    el.style.opacity = "0";
    el.style.transform = "translateX(30px)";
    setTimeout(() => el.remove(), 300);
  }

  function loadWishes() {
    try {
      return JSON.parse(localStorage.getItem("mepandes_wishes") || "[]");
    } catch {
      return [];
    }
  }

  function saveWishes(data) {
    try {
      localStorage.setItem("mepandes_wishes", JSON.stringify(data));
    } catch {
      // Silently fail
    }
  }

  function renderSavedWishes() {
    wishes.forEach((wish) => addWishToDOM(wish));
  }

  /* ===== UTILITY ===== */
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ===== SMOOTH SCROLL FOR ANCHOR LINKS ===== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute("href"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  /* ===== PARALLAX EFFECT ON COVER ===== */
  function initCoverParallax() {
    document.addEventListener("mousemove", (e) => {
      if (DOM.cover.style.display === "none") return;
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      const coverContent = DOM.cover.querySelector(".cover-content");
      if (coverContent) {
        coverContent.style.transform = `translate(${x}px, ${y}px)`;
      }
    });
  }

  /* ===== INITIALIZE ===== */
  function init() {
    // Lock body scroll while cover is shown
    document.body.style.overflow = "hidden";

    // Dismiss loading screen
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add("fade-out");
        setTimeout(() => loadingScreen.remove(), 600);
      }, 2500);
    }

    // Set guest name from URL
    setGuestName();

    // Render any previously saved wishes
    renderSavedWishes();

    // Event listeners
    DOM.btnOpen.addEventListener("click", openInvitation);
    DOM.audioToggle.addEventListener("click", toggleMusic);
    DOM.rsvpForm.addEventListener("submit", handleRSVP);

    // Admin Reset (only for admin)
    if (CONFIG.isAdmin && DOM.btnReset) {
      DOM.btnReset.addEventListener("click", handleReset);
      DOM.btnReset.style.display = "block";
    }

    // Smooth scroll
    initSmoothScroll();

    // Parallax
    initCoverParallax();
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
