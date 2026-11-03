// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const MEDAL_CLASSES = ["gold", "silver", "bronze"];
const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

function buildLeaderboard() {
    const players = getPlayerStats();
    const totalComps = DEMONS.reduce((s, d) => s + completionCount(d), 0);

    document.getElementById("lbStats").innerHTML = `
    <div class="stat-card"><div class="stat-val">${DEMONS.length}</div><div class="stat-lbl">Demons Listed</div></div>
    <div class="stat-card"><div class="stat-val">${players.length}</div><div class="stat-lbl">Ranked Players</div></div>
    <div class="stat-card"><div class="stat-val green">${totalComps}</div><div class="stat-lbl">Total Completions</div></div>`;

    renderLeaderboardTable();

    // Podium — top 3
    document.getElementById("podium").innerHTML =
        players
            .slice(0, 3)
            .map(
                (p, i) => `
    <div class="mini-row" data-player="${esc(p.name)}">
      <div class="mini-row-left">
        <span class="podium-emoji">${MEDAL_EMOJIS[i]}</span>
        <span>${esc(p.flag)}</span>
        <span class="mini-row-name">${esc(p.name)}</span>
      </div>
      <span class="podium-pts" style="color:var(--${MEDAL_CLASSES[i]})">${p.pts} pts</span>
    </div>`,
            )
            .join("") || '<div class="muted small">No data yet</div>';

    // Most completed demons
    const mostCompleted = DEMONS.map((d) => ({ d, count: completionCount(d) }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count || a.d.rank - b.d.rank)
        .slice(0, 5);

    document.getElementById("mostCompleted").innerHTML =
        mostCompleted
            .map(
                ({ d, count }) => `
    <div class="mini-row" data-demon="${d.rank}">
      <div class="mini-row-left">
        <span class="mono small muted">#${d.rank}</span>
        <span class="mini-row-name">${esc(d.name)}</span>
      </div>
      <span class="pct full">${count}✓</span>
    </div>`,
            )
            .join("") || '<div class="muted small">No completions yet</div>';

    // Recent records (only records that carry a date)
    const recent = DEMONS.flatMap((d) => d.records.filter((r) => r.createdAt).map((r) => ({ d, r })))
        .sort((a, b) => new Date(b.r.createdAt) - new Date(a.r.createdAt))
        .slice(0, 6);

    document.getElementById("recentRecords").innerHTML =
        recent
            .map(
                ({ d, r }) => `
    <div class="mini-row" data-player="${esc(r.player)}">
      <div class="mini-row-left">
        <span>${esc(r.flag)}</span>
        <span class="mini-row-name">${esc(r.player)} <span class="muted">on</span> ${esc(d.name)}</span>
      </div>
      <span class="pct ${r.pct === 100 ? "full" : ""}">${r.pct}%</span>
    </div>`,
            )
            .join("") || '<div class="muted small">No dated records yet</div>';
}

function renderLeaderboardTable() {
    const q = document.getElementById("lbSearch").value.trim().toLowerCase();
    const players = getPlayerStats().filter((p) => !q || p.name.toLowerCase().includes(q));

    document.getElementById("lbBody").innerHTML = players.length
        ? players
              .map((p) => {
                  const cls = MEDAL_CLASSES[p.position - 1] || "";
                  const hardest = p.hardest
                      ? `<span class="mono">#${p.hardest.rank}</span>${esc(p.hardest.name)}`
                      : '<span class="muted">—</span>';
                  return `<tr data-player="${esc(p.name)}">
      <td><span class="lb-num ${cls}">${p.position}</span></td>
      <td><span class="lb-player"><span>${esc(p.flag)}</span>${esc(p.name)}</span></td>
      <td><span class="lb-pts">${p.pts}</span></td>
      <td><span class="lb-comps">${p.comps} complete</span></td>
      <td class="lb-col-hardest"><span class="lb-hardest">${hardest}</span></td>
    </tr>`;
              })
              .join("")
        : `<tr class="lb-empty"><td colspan="5">${q ? "No players match your search" : "No records yet"}</td></tr>`;
}
