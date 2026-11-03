// ═══════════════════════════════════════════════════════════════════════════════
// THEME PICKER — accent hue, persisted in localStorage
// ═══════════════════════════════════════════════════════════════════════════════
const THEME_PRESETS = [
    { label: "Red", hue: 2 },
    { label: "Orange", hue: 25 },
    { label: "Yellow", hue: 50 },
    { label: "Green", hue: 140 },
    { label: "Teal", hue: 175 },
    { label: "Blue", hue: 215 },
    { label: "Purple", hue: 270 },
    { label: "Pink", hue: 330 },
];

let currentHue = 2; // default red

function setAccentHue(hue) {
    hue = ((Number(hue) % 360) + 360) % 360;
    currentHue = hue;
    const root = document.documentElement;
    root.style.setProperty("--accent", `hsl(${hue},77%,57%)`);
    root.style.setProperty("--accent2", `hsl(${(hue + 18) % 360},77%,62%)`);
    root.style.setProperty("--accent-glow", `hsla(${hue},77%,57%,0.25)`);
    try {
        localStorage.setItem("accentHue", hue);
    } catch {}

    // Repaint the hero that's currently on screen
    const heroBg = document.querySelector(".hero-bg");
    if (heroBg && currentRank !== null) {
        const d = getDemon(currentRank);
        if (d) heroBg.style.backgroundImage = heroBackground(d);
    }

    document.getElementById("themePreviewDot").style.background = `hsl(${hue},77%,57%)`;
    document.getElementById("hueSlider").value = hue;
    syncSwatches(hue);
}

// Tinted gradient laid over the level's YouTube thumbnail. Deeper ranks get darker.
function heroBackground(demon) {
    const tier = Math.min(Math.floor((demon.rank - 1) / 3), 4);
    const sat = [80, 75, 65, 55, 40][tier];
    const light = [22, 17, 13, 10, 8][tier];
    const tint = `linear-gradient(135deg,hsla(${currentHue},${sat}%,${light}%,0.65),hsla(${currentHue},${sat}%,3%,0.85))`;
    return demon.video ? `${tint}, url("${youtubeThumb(demon.video)}")` : tint;
}

function syncSwatches(hue) {
    document.querySelectorAll(".theme-swatch").forEach((sw) => {
        sw.classList.toggle("active", Math.abs(sw.dataset.hue - hue) < 8);
    });
}

function toggleThemePicker() {
    document.getElementById("themePopover").classList.toggle("open");
}

function closeThemePicker() {
    document.getElementById("themePopover").classList.remove("open");
}

function initThemePicker() {
    const wrap = document.getElementById("themeSwatches");
    THEME_PRESETS.forEach((p) => {
        const btn = document.createElement("button");
        btn.className = "theme-swatch";
        btn.title = p.label;
        btn.setAttribute("aria-label", `${p.label} accent`);
        btn.dataset.hue = p.hue;
        btn.style.background = `hsl(${p.hue},77%,57%)`;
        btn.onclick = () => setAccentHue(p.hue);
        wrap.appendChild(btn);
    });

    // Close popover on outside click
    document.addEventListener("click", (e) => {
        if (!document.querySelector(".theme-wrap").contains(e.target)) closeThemePicker();
    });

    // Restore saved hue immediately, before data loads, to avoid a colour flash
    let saved = null;
    try {
        saved = localStorage.getItem("accentHue");
    } catch {}
    setAccentHue(saved !== null ? Number(saved) : currentHue);
}
