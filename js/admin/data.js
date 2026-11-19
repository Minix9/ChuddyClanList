// ═══════════════════════════════════════════════════════════════════════════════
// STATE + LOAD ALL DATA
// ═══════════════════════════════════════════════════════════════════════════════
let demons = [];
let players = [];
let records = [];
let changelog = null; // null until loaded — stays null if the changelog table doesn't exist yet

async function loadAll(announce = false) {
    try {
        [demons, players, records, changelog] = await Promise.all([
            sbFetch("/rest/v1/demons?select=*&order=rank.asc"),
            sbFetch("/rest/v1/players?select=*&order=name.asc"),
            sbFetch("/rest/v1/records?select=*,demons(name,rank),players(name,flag)&order=created_at.desc"),
            // optional: before supabase_changelog.sql is run this fails, the rest still loads
            sbFetch("/rest/v1/changelog?select=*&order=published_on.desc,created_at.desc").catch(() => null),
        ]);
        renderAll();
        if (announce) toast("Data reloaded", "success");
    } catch (e) {
        toast("Failed to load data: " + e.message, "error");
    }
}

function renderAll() {
    document.getElementById("navCountDemons").textContent = demons.length;
    document.getElementById("navCountRecords").textContent = records.length;
    document.getElementById("navCountPlayers").textContent = players.length;
    document.getElementById("navCountChangelog").textContent = changelog?.length ?? "";
    renderDashboard();
    renderDemons();
    renderRecords();
    renderPlayers();
    renderChangelogTable();
    populateSelects();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELECT POPULATION
// ═══════════════════════════════════════════════════════════════════════════════
function populateSelects() {
    // Snapshot active selections before rebuilding so loadAll() doesn't reset them
    const ids = ["filterDemon", "filterPlayer", "recordDemon", "recordPlayer"];
    const prev = Object.fromEntries(ids.map((id) => [id, document.getElementById(id).value]));

    const demonOpts = demons.map((d) => `<option value="${d.id}">#${d.rank} ${esc(d.name)}</option>`).join("");
    // Plain names: <option> can't show flag images, and flag emoji render as letters on Windows
    const playerOpts = players.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");

    document.getElementById("recordDemon").innerHTML = demonOpts;
    document.getElementById("recordPlayer").innerHTML = playerOpts;
    document.getElementById("filterDemon").innerHTML = '<option value="">All demons</option>' + demonOpts;
    document.getElementById("filterPlayer").innerHTML = '<option value="">All players</option>' + playerOpts;

    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (prev[id] && [...el.options].some((o) => o.value === prev[id])) el.value = prev[id];
    });
}

// For each demon, finds the 100% record with the earliest created_at —
// that record's id is considered the "first victor" of that demon.
// Levels with a verifier have no first victor (the verifier takes that spot)
function getFirstVictorIds() {
    const verified = new Set(records.filter((r) => r.is_verifier).map((r) => r.demon_id));
    const earliestByDemon = {};
    records.forEach((r) => {
        if (r.percentage !== 100 || verified.has(r.demon_id)) return;
        const existing = earliestByDemon[r.demon_id];
        if (!existing || new Date(r.created_at) < new Date(existing.created_at)) earliestByDemon[r.demon_id] = r;
    });
    return new Set(Object.values(earliestByDemon).map((r) => r.id));
}
