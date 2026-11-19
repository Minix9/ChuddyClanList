// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER — hash-based so it works on GitHub Pages and file://
//   #/                 home page
//   #/list             list (keeps the last selected level)
//   #/demon/<rank>     list with that level open
//   #/level/<name>     same, found by name (stable links for the changelog)
//   #/leaderboard
//   #/roulette
//   #/changelog
//   #/player/<name>
// Every page has its own URL, so links can be shared and Back/Forward work.
// ═══════════════════════════════════════════════════════════════════════════════
const VIEWS = {
    home: "homeTab",
    list: "listTab",
    leaderboard: "lbTab",
    roulette: "rouletteTab",
    changelog: "changelogTab",
    profile: "profileTab",
};

// How many pages of this site are behind the current one in the browser history.
// Stored in each history entry, so Back/Forward and reloads keep it right, and the
// back button never sends anyone off the site.
let navDepth = history.state?.depth ?? 0;
let replacing = false; // the next hashchange swaps the current entry instead of adding one
try {
    history.replaceState({ depth: navDepth }, "");
} catch {}

function goBack() {
    if (navDepth > 0) history.back();
}

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
        case "level": {
            // Link by name (used in the changelog) — names stay put when ranks change
            let name = arg;
            try {
                name = decodeURIComponent(arg);
            } catch {}
            return { tab: "list", rank: DEMONS.find((d) => d.name.toLowerCase() === name.toLowerCase())?.rank };
        }
        case "list":
            return { tab: "list" };
        default:
            return { tab: "home" };
    }
}

function showView(tab) {
    for (const [name, id] of Object.entries(VIEWS)) {
        document.getElementById(id).classList.toggle("visible", name === tab);
    }
    document.getElementById("appBody").classList.toggle("no-sidebar", tab !== "list");
    document.getElementById("mobToggle").hidden = tab !== "list";
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
}

function renderRoute() {
    const route = parseRoute();
    let title = "";

    if (route.tab === "home") {
        renderHome();
    } else if (route.tab === "list") {
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
        document.getElementById("changelogList").innerHTML =
            CHANGELOG.map((e) => changelogEntryHTML(e)).join("") || `<div class="no-records">${icon("history")}No updates yet</div>`;
        title = "Changelog";
    } else if (route.tab === "profile") {
        renderProfilePage(route.player);
        title = route.player;
    }

    showView(route.tab);
    if (route.tab !== "list") document.getElementById("mainArea").scrollTop = 0;
    document.title = title ? `${title} — Chuddy List` : "Chuddy List";
    document.getElementById("backBtn").disabled = navDepth === 0;
}

// replace=true swaps the current history entry (used for arrow-key browsing,
// so Back doesn't have to step through every level you scrolled past)
function navigate(hash, replace = false) {
    if (location.hash === hash) return renderRoute();
    // Both fire "hashchange", which calls renderRoute()
    if (replace) {
        replacing = true;
        location.replace(hash);
    } else location.hash = hash;
}

// The one place level / player URLs are built
const levelHref = (rank) => `#/demon/${rank}`;
const playerHref = (name) => `#/player/${encodeURIComponent(name)}`;

function goToDemon(rank, replace = false) {
    navigate(levelHref(rank), replace);
}

function goToPlayer(name) {
    navigate(playerHref(name));
}

window.addEventListener("hashchange", () => {
    const known = history.state?.depth;
    if (known != null) navDepth = known; // Back / Forward to a page we've already been on
    else {
        if (!replacing) navDepth++; // a new page (link, nav button, typed URL)
        try {
            history.replaceState({ depth: navDepth }, "");
        } catch {}
    }
    replacing = false;
    renderRoute();
});
