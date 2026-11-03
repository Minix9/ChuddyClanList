// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// DEMONS shape: [{ rank, name, creator, video, records: [{ player, flag, pct,
//                  attempts, video, createdAt, isFirstVictor }] }]
// ═══════════════════════════════════════════════════════════════════════════════
let DEMONS = [];
let filtered = [];
let currentRank = null;
let usingSupabase = false;

let playerStatsCache = null;

function setDemons(list) {
    DEMONS = [...list].sort((a, b) => a.rank - b.rank);
    DEMONS.forEach((d) => d.records.sort(compareRecords));
    filtered = [...DEMONS];
    playerStatsCache = null;
}

// Full clears first (earliest first, so the first victor leads), then partials by %
function compareRecords(a, b) {
    if (b.pct !== a.pct) return b.pct - a.pct;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
    return ta - tb;
}

function getDemon(rank) {
    return DEMONS.find((d) => d.rank === rank);
}

function calcScore(rank, percent) {
    return calcPoints(rank, percent, DEMONS.length);
}

function completionCount(demon) {
    return demon.records.filter((r) => r.pct === 100).length;
}

// Medal / top-10 colour class for a list position
function rankClass(rank) {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    if (rank <= 10) return "rank-top10";
    return "";
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER STATS — one pass over every record, shared by leaderboard + profiles
// Returns players sorted by points, each with .position (1-based)
// ═══════════════════════════════════════════════════════════════════════════════
function getPlayerStats() {
    if (playerStatsCache) return playerStatsCache;

    const map = {};
    DEMONS.forEach((d) => {
        d.records.forEach((r) => {
            if (!map[r.player]) {
                map[r.player] = { name: r.player, flag: r.flag, pts: 0, comps: 0, hardest: null, records: {} };
            }
            const p = map[r.player];
            p.pts += calcScore(d.rank, r.pct);
            p.records[d.rank] = r;
            if (r.pct === 100) {
                p.comps++;
                if (!p.hardest || d.rank < p.hardest.rank) p.hardest = d;
            }
        });
    });

    const sorted = Object.values(map).sort((a, b) => b.pts - a.pts || b.comps - a.comps || a.name.localeCompare(b.name));
    // Tied players share a position
    sorted.forEach((p, i) => {
        p.position = i > 0 && sorted[i - 1].pts === p.pts ? sorted[i - 1].position : i + 1;
    });

    playerStatsCache = sorted;
    return sorted;
}

function getPlayer(name) {
    return getPlayerStats().find((p) => p.name === name);
}
