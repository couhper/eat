/* ============================================================
   Where Should We Eat? — app logic
   Vanilla JS, no dependencies. Reads RESTAURANTS from data.js.
   ============================================================ */

"use strict";

// ---------- State ----------
const state = {
  category: null,        // "food" | "boba" | "dessert"
  userPos: null,         // { lat, lon } once geolocation resolves
  lastPick: null,        // name of the previous pick (avoid repeats)
  spinning: false,
  sound: load("sound", true),
  favorites: load("favorites", []),
};

// ---------- DOM ----------
const $ = (sel) => document.querySelector(sel);
const el = {
  catButtons: document.querySelectorAll(".cat-btn"),
  distance: $("#distance"),
  locStatus: $("#locStatus"),
  machine: $("#machine"),
  capsules: $("#capsules"),
  prizeCapsule: $("#prizeCapsule"),
  prizeText: $("#prizeText"),
  result: $("#result"),
  spinBtn: $("#spinBtn"),
  favBtn: $("#favBtn"),
  favoritesCard: $("#favoritesCard"),
  favoritesList: $("#favoritesList"),
  soundToggle: $("#soundToggle"),
  themeToggle: $("#themeToggle"),
  confetti: $("#confetti"),
};

const BALL_COLORS = ["#ff5d8f", "#6c8bff", "#ffd86b", "#4ecdc4", "#c77dff", "#ff9f43"];
const MILES_PER_DEGREE = 69; // good enough for a "within X miles" toy filter

// ============================================================
// Setup
// ============================================================
init();

function init() {
  // Theme: respect saved choice, else system preference.
  const savedTheme = load("theme", null);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(savedTheme || (prefersDark ? "dark" : "light"));

  setSound(state.sound);
  fillDome();
  renderFavorites();

  el.catButtons.forEach((btn) =>
    btn.addEventListener("click", () => selectCategory(btn.dataset.category))
  );
  el.spinBtn.addEventListener("click", spin);
  el.favBtn.addEventListener("click", saveCurrentFavorite);
  el.soundToggle.addEventListener("click", () => setSound(!state.sound));
  el.themeToggle.addEventListener("click", toggleTheme);
  el.distance.addEventListener("change", onDistanceChange);

  window.addEventListener("resize", sizeConfettiCanvas);
  sizeConfettiCanvas();
}

// ============================================================
// Category + filter
// ============================================================
function selectCategory(category) {
  state.category = category;
  state.lastPick = null;
  el.catButtons.forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.category === category))
  );
  fillDome();
  el.spinBtn.disabled = false;
  el.spinBtn.textContent = "Spin!";
  el.result.textContent = "";
  el.favBtn.hidden = true;
  resetCapsule();
}

function onDistanceChange() {
  // Only bother asking for location when the user actually wants a limit.
  if (Number(el.distance.value) > 0 && !state.userPos) requestLocation();
}

function requestLocation() {
  if (!("geolocation" in navigator)) {
    el.locStatus.textContent = "Location not supported — using all places.";
    return;
  }
  el.locStatus.textContent = "Getting your location…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.userPos = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      el.locStatus.textContent = "📍 Location on — filtering by distance.";
    },
    () => {
      el.locStatus.textContent = "Location denied — using all places.";
    }
  );
}

/** Restaurants eligible for the current category + distance filter. */
function eligiblePlaces() {
  const all = RESTAURANTS[state.category] || [];
  const limit = Number(el.distance.value);
  if (!limit || !state.userPos) return all;

  const within = all.filter((r) => milesBetween(state.userPos, r) <= limit);
  // If the filter empties the list, fall back to everything rather than failing.
  if (within.length === 0) {
    el.locStatus.textContent = `Nothing within ${limit} mi — showing all instead.`;
    return all;
  }
  return within;
}

/** Rough great-circle-ish distance. Toy-accurate, not survey-accurate. */
function milesBetween(pos, r) {
  if (typeof r.latitude !== "number" || typeof r.longitude !== "number") return Infinity;
  const dLat = r.latitude - pos.lat;
  const dLon = (r.longitude - pos.lon) * Math.cos((pos.lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon) * MILES_PER_DEGREE;
}

// ============================================================
// The spin
// ============================================================
async function spin() {
  if (state.spinning || !state.category) return;

  const places = eligiblePlaces();
  if (places.length === 0) {
    el.result.textContent = "No places to pick from 🥲";
    return;
  }

  state.spinning = true;
  el.spinBtn.disabled = true;
  el.favBtn.hidden = true;
  el.result.textContent = "";
  resetCapsule();

  const pick = choosePick(places);

  // Animate: coin → crank → shake.
  beep(440, 0.08);
  el.machine.classList.add("coin-drop");
  await wait(500);

  el.machine.classList.add("cranking");
  beep(330, 0.12);
  await wait(700);

  el.machine.classList.add("shaking");
  rattle();
  await wait(900);
  el.machine.classList.remove("shaking");

  // Capsule rolls out (food name tucked inside).
  el.prizeText.innerHTML = `<span>${escapeHtml(pick.name)}</span>`;
  el.prizeCapsule.hidden = false;
  el.prizeCapsule.classList.add("rollout");
  beep(520, 0.1);
  await wait(900);

  // Pop it open + celebrate.
  el.prizeCapsule.classList.add("open");
  popChord();
  burstConfetti();
  await wait(400);

  showResult(pick);
  state.lastPick = pick.name;
  state.spinning = false;
  el.machine.classList.remove("coin-drop", "cranking");
  el.spinBtn.disabled = false;
  el.spinBtn.textContent = "Spin Again";
}

/** Pick randomly, avoiding an immediate repeat when possible. */
function choosePick(places) {
  if (places.length === 1) return places[0];
  let pick;
  do {
    pick = places[Math.floor(Math.random() * places.length)];
  } while (pick.name === state.lastPick);
  return pick;
}

function showResult(pick) {
  const bits = [];
  if (pick.rating) bits.push("⭐ " + pick.rating);
  if (pick.notes) bits.push(pick.notes);
  el.result.innerHTML =
    `Let's go to <strong>${escapeHtml(pick.name)}</strong>!` +
    (bits.length ? `<span class="sub">${escapeHtml(bits.join(" · "))}</span>` : "");
  el.favBtn.hidden = false;
  el.favBtn.dataset.name = pick.name;
  el.favBtn.dataset.category = pick.category;
  el.favBtn.textContent = isFavorite(pick.name) ? "★ Saved" : "☆ Save favorite";
}

function resetCapsule() {
  el.prizeCapsule.classList.remove("rollout", "open");
  el.prizeCapsule.hidden = true;
  el.machine.classList.remove("coin-drop", "cranking", "shaking");
}

// ============================================================
// Dome of bouncing capsules (decorative)
// ============================================================
function fillDome() {
  // Fill the (bigger) dome so it always looks packed with capsules.
  const count = 20;
  let html = "";
  for (let i = 0; i < count; i++) {
    const color = BALL_COLORS[i % BALL_COLORS.length];
    const top = 12 + Math.random() * 218;   // dome is ~280px tall, balls 38px
    const left = 10 + Math.random() * 264;  // dome is ~314px wide
    const delay = (Math.random() * 0.4).toFixed(2);
    html += `<span class="ball" style="background:${color};top:${top}px;left:${left}px;animation-delay:${delay}s"></span>`;
  }
  el.capsules.innerHTML = html;
}

// ============================================================
// Favorites (localStorage)
// ============================================================
function isFavorite(name) {
  return state.favorites.some((f) => f.name === name);
}

function saveCurrentFavorite() {
  const { name, category } = el.favBtn.dataset;
  if (!name || isFavorite(name)) return;
  state.favorites.push({ name, category });
  save("favorites", state.favorites);
  el.favBtn.textContent = "★ Saved";
  renderFavorites();
}

function removeFavorite(name) {
  state.favorites = state.favorites.filter((f) => f.name !== name);
  save("favorites", state.favorites);
  renderFavorites();
}

function renderFavorites() {
  el.favoritesCard.hidden = state.favorites.length === 0;
  el.favoritesList.innerHTML = state.favorites
    .map(
      (f) =>
        `<li><span>${categoryEmoji(f.category)} ${escapeHtml(f.name)}</span>` +
        `<button data-name="${escapeHtml(f.name)}" title="Remove">✕</button></li>`
    )
    .join("");
  el.favoritesList.querySelectorAll("button").forEach((btn) =>
    btn.addEventListener("click", () => removeFavorite(btn.dataset.name))
  );
}

function categoryEmoji(cat) {
  return { food: "🍜", boba: "🧋", dessert: "🍰" }[cat] || "🍽️";
}

// ============================================================
// Theme + sound toggles
// ============================================================
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  el.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  el.themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  save("theme", theme);
}
function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  setTheme(next);
}
function setSound(on) {
  state.sound = on;
  el.soundToggle.textContent = on ? "🔊" : "🔇";
  el.soundToggle.setAttribute("aria-pressed", String(on));
  save("sound", on);
}

// ============================================================
// Sound effects — synthesized with Web Audio, no asset files.
// ============================================================
let audioCtx = null;
function beep(freq, duration, type = "sine") {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) { /* audio unavailable — ignore */ }
}
function rattle() {
  // A few quick clicks while the capsules shake.
  [0, 120, 240, 360, 480].forEach((ms, i) => setTimeout(() => beep(200 + i * 40, 0.05, "square"), ms));
}
function popChord() {
  [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.25, "triangle"), i * 70));
}

// ============================================================
// Confetti — lightweight canvas burst, self-cleaning.
// ============================================================
let confettiPieces = [];
let confettiRAF = null;
const ctx = el.confetti.getContext("2d");

function sizeConfettiCanvas() {
  el.confetti.width = window.innerWidth;
  el.confetti.height = window.innerHeight;
}

function burstConfetti() {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  for (let i = 0; i < 120; i++) {
    confettiPieces.push({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -12 - 4,
      size: 6 + Math.random() * 6,
      color: BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      life: 1,
    });
  }
  if (!confettiRAF) confettiRAF = requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
  ctx.clearRect(0, 0, el.confetti.width, el.confetti.height);
  confettiPieces.forEach((p) => {
    p.vy += 0.3;          // gravity
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;
    p.life -= 0.01;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  });
  confettiPieces = confettiPieces.filter((p) => p.life > 0 && p.y < el.confetti.height + 40);
  if (confettiPieces.length) {
    confettiRAF = requestAnimationFrame(drawConfetti);
  } else {
    ctx.clearRect(0, 0, el.confetti.width, el.confetti.height);
    confettiRAF = null;
  }
}

// ============================================================
// Helpers
// ============================================================
function wait(ms) { return new Promise((res) => setTimeout(res, ms)); }

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem("wswe_" + key)) ?? fallback; }
  catch (_) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem("wswe_" + key, JSON.stringify(value)); } catch (_) {}
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
