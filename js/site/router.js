// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER — hash-based so it works on GitHub Pages and file://
//   #/                 list (keeps the last selected level)
//   #/demon/<rank>     list with that level open
//   #/leaderboard
//   #/roulette
//   #/changelog
//   #/player/<name>
// Every page has its own URL, so links can be shared and Back/Forward work.
// ═══════════════════════════════════════════════════════════════════════════════
const VIEWS = {
    list: "listTab",
    leaderboard: "lbTab",
    roulette: "rouletteTab",
    changelog: "changelogTab",
    profile: "profileTab",
};

let hasAppHistory = false; // true once the user has navigated inside the app

function parseRoute() {
    const [page = "", ...rest] = location.hash.replace(/^#\/?/, "").split("/");
    const arg = rest.join("/");
    switch (page) {
        case "leaderboard":
            return { tab: "leaderboard" };
        case "roulette":
            return { tab: "roulette" };
        case "changelog":
            return { tab: "changelog" };
        case "player": {
            let name = arg;
            try {
                name = decodeURIComponent(arg);
            } catch {}
            return { tab: "profile", player: name };
        }
        case "demon":
            return { tab: "list", rank: parseInt(arg) };
        default:
            return { tab: "list" };
    }
}

function showView(tab) {
    for (const [name, id] of Object.entries(VIEWS)) {
        document.getElementById(id).classList.toggle("visible", name === tab);
    }
    document.getElementById("appBody").classList.toggle("no-sidebar", tab !== "list");
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
}

function renderRoute() {
    const route = parseRoute();
    let title = "";

    if (route.tab === "list") {
        const rank = getDemon(route.rank) ? route.rank : (currentRank ?? DEMONS[0]?.rank);
        if (rank != null && selectDemon(rank)) title = getDemon(rank).name;
        else {
            document.getElementById("emptyTitle").textContent = "No levels yet";
            document.getElementById("emptySub").textContent = "Levels added in the admin panel will show up here.";
        }
        toggleSidebar(false);
    } else if (route.tab === "leaderboard") {
        buildLeaderboard();
        title = "Leaderboard";
    } else if (route.tab === "roulette") {
        refreshRoulette();
        title = "Roulette";
    } else if (route.tab === "changelog") {
        title = "Changelog";
    } else if (route.tab === "profile") {
        renderProfilePage(route.player);
        title = route.player;
    }

    showView(route.tab);
    if (route.tab !== "list") document.getElementById("mainArea").scrollTop = 0;
    document.title = title ? `${title} — Chuddy List` : "Chuddy List";
}

// replace=true swaps the current history entry (used for arrow-key browsing,
// so Back doesn't have to step through every level you scrolled past)
function navigate(hash, replace = false) {
    if (location.hash === hash) return renderRoute();
    // Both fire "hashchange", which calls renderRoute()
    if (replace) location.replace(hash);
    else location.hash = hash;
}

function goToDemon(rank, replace = false) {
    navigate(`#/demon/${rank}`, replace);
}

function goToPlayer(name) {
    navigate(`#/player/${encodeURIComponent(name)}`);
}

window.addEventListener("hashchange", () => {
    hasAppHistory = true;
    renderRoute();
});
