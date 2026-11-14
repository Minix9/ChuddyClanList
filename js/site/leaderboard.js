// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const MEDAL_CLASSES = ["gold", "silver", "bronze"];

function buildLeaderboard() {
    renderLeaderboardTable();

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
        <span class="rank-num">#${d.rank}</span>
        <div style="min-width:0">
          <div class="mini-row-name">${esc(d.name)}</div>
          <div class="mini-row-sub">by ${esc(d.creator)}</div>
        </div>
      </div>
      <span class="pct full">${count}×</span>
    </div>`,
            )
            .join("") || '<div class="no-records">No completions yet</div>';

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
        ${flagHTML(r.flag)}
        <div style="min-width:0">
          <div class="mini-row-name">${esc(r.player)}</div>
          <div class="mini-row-sub">#${d.rank} ${esc(d.name)} · ${formatShortDate(r.createdAt)}</div>
        </div>
      </div>
      <span class="pct ${r.pct === 100 ? "full" : ""}">${r.pct}%</span>
    </div>`,
            )
            .join("") || '<div class="no-records">No dated records yet</div>';
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
      <td><span class="lb-player">${flagHTML(p.flag)}${esc(p.name)}</span></td>
      <td class="num"><span class="lb-pts">${p.pts.toLocaleString()}</span></td>
      <td class="num"><span class="lb-comps">${p.comps}</span></td>
      <td class="lb-col-hardest"><div class="lb-hardest">${hardest}</div></td>
    </tr>`;
              })
              .join("")
        : `<tr class="lb-empty"><td colspan="5">${q ? "No players match your search" : "No records yet"}</td></tr>`;
}
