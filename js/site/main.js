// ═══════════════════════════════════════════════════════════════════════════════
// INIT + GLOBAL EVENT HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

// Delegated clicks for dynamically rendered content. Rows carry data-* attributes
// instead of inline onclick strings, so names with quotes can't break anything.
document.addEventListener("click", (e) => {
    const video = e.target.closest("[data-video]");
    if (video) {
        e.stopPropagation();
        openVideoLightbox(video.dataset.video, video.dataset.title || "");
        return;
    }
    const player = e.target.closest("[data-player]");
    if (player) {
        goToPlayer(player.dataset.player);
        return;
    }
    const demon = e.target.closest("[data-demon]");
    if (demon) goToDemon(Number(demon.dataset.demon));
});

// Keyboard shortcuts:  /  focus search · ↑ ↓ browse levels · Enter open first result · Esc close
document.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing = t.matches?.("input, textarea, select") && t.id !== "searchInput";
    const onList = parseRoute().tab === "list";

    if (e.key === "Escape") {
        if (isLightboxOpen()) return closeVideoLightboxDirect();
        closeThemePicker();
        toggleSidebar(false);
        if (t.id === "searchInput") t.blur();
        return;
    }
    if (typing || isLightboxOpen() || e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === "/" && t.id !== "searchInput") {
        e.preventDefault();
        if (!onList) navigate("#/");
        toggleSidebar(true);
        document.getElementById("searchInput").focus();
    } else if (onList && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        moveSelection(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && t.id === "searchInput" && filtered.length) {
        goToDemon(filtered[0].rank);
        t.blur();
    }
});

async function init() {
    hydrateIcons();
    initThemePicker();
    await loadData();
    renderSidebar(DEMONS);
    renderRoute();
}

init();
