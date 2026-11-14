// ═══════════════════════════════════════════════════════════════════════════════
// STATUS BAR HELPER
// ═══════════════════════════════════════════════════════════════════════════════
let statusTimer;

function showStatus(msg, live = false, autohide = 0) {
    const bar = document.getElementById("statusBar");
    document.getElementById("statusMsg").textContent = msg;
    document.getElementById("statusDot").classList.toggle("live", live);
    bar.classList.add("show");
    clearTimeout(statusTimer);
    if (autohide) statusTimer = setTimeout(() => bar.classList.remove("show"), autohide);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO LIGHTBOX (used by the "watch" buttons on records and profiles)
// ═══════════════════════════════════════════════════════════════════════════════
function openVideoLightbox(videoId, title) {
    document.getElementById("lightboxTitle").textContent = title;
    document.getElementById("lightboxFrame").innerHTML =
        `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1" allow="autoplay; fullscreen" allowfullscreen title="${esc(title)}"></iframe>`;
    document.getElementById("videoLightbox").classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeVideoLightboxDirect() {
    document.getElementById("videoLightbox").classList.remove("open");
    document.getElementById("lightboxFrame").innerHTML = "";
    document.body.style.overflow = "";
}

function closeVideoLightbox(e) {
    if (e.target === document.getElementById("videoLightbox")) closeVideoLightboxDirect();
}

function isLightboxOpen() {
    return document.getElementById("videoLightbox").classList.contains("open");
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════
function toggleSidebar(force) {
    document.getElementById("sidebar").classList.toggle("open", force);
}

// Tabs: each .detail-tab[data-pane] shows the .detail-pane with the same data-pane inside root
function initTabs(root, pane, onChange) {
    const show = (p) => {
        root.querySelectorAll(".detail-tab").forEach((b) => {
            b.classList.toggle("active", b.dataset.pane === p);
            b.setAttribute("aria-selected", b.dataset.pane === p);
        });
        root.querySelectorAll(".detail-pane").forEach((el) => (el.hidden = el.dataset.pane !== p));
        onChange?.(p);
    };
    root.querySelectorAll(".detail-tab").forEach((b) => (b.onclick = () => show(b.dataset.pane)));
    show(pane);
}
