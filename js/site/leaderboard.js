// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD — ranking table + "most completed" and "recent records" lists
// ═══════════════════════════════════════════════════════════════════════════════

// Row for one record in a "recent records" list (also used on the home page)
function recentRecordRow({ d, r }) {
    return `<li class="row" data-player="${esc(r.player)}">
      ${flagHTML(r.flag)}
      <span class="row-main">
        <span class="row-title">${esc(r.player)}</span>
        <span class="row-sub">#${d.rank} ${esc(d.name)} · ${formatShortDate(r.createdAt)}</span>
      </span>
      <span class="pct ${r.pct === 100 ? "full" : ""}">${r.pct}%</span>
    </li>`;
}

function buildLeaderboard() {
    renderLeaderboardTable();

    const mostCompleted = DEMONS.map((d) => ({ d, count: completionCount(d) }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count || a.d.rank - b.d.rank)
        .slice(0, 5);
    document.getElementById("mostCompleted").innerHTML =
        mostCompleted
            .map(
                ({ d, count }) => `<li class="row" data-demon="${d.rank}">
      <span class="row-rank">#${d.rank}</span>
      <span class="row-main"><span class="row-title">${esc(d.name)}</span><span class="row-sub">by ${esc(d.creator)}</span></span>
      <span class="count">${count}×</span>
    </li>`,
            )
            .join("") || `<li class="no-records">No completions yet</li>`;

    document.getElementById("recentRecords").innerHTML =
        recentRecords(6).map(recentRecordRow).join("") || `<li class="no-records">No dated records yet</li>`;
}

function renderLeaderboardTable() {
    const q = document.getElementById("lbSearch").value.trim().toLowerCase();
    const players = getPlayerStats().filter((p) => !q || p.name.toLowerCase().includes(q));

    document.getElementById("lbBody").innerHTML = players.length
        ? players
              .map((p) => {
                  const hardest = p.hardest
                      ? `<span class="mono">#${p.hardest.rank}</span>${esc(p.hardest.name)}`
                      : '<span class="muted">—</span>';
                  return `<tr data-player="${esc(p.name)}">
      <td><span class="lb-num ${medalClass(p.position)}">${p.position}</span></td>
      <td><span class="lb-player">${flagHTML(p.flag)}${esc(p.name)}</span></td>
      <td class="num lb-pts">${p.pts.toLocaleString()}</td>
      <td class="num lb-comps">${p.comps}</td>
      <td class="lb-col-hardest"><div class="lb-hardest">${hardest}</div></td>
    </tr>`;
              })
              .join("")
        : `<tr class="lb-empty"><td colspan="5">${q ? "No players match your search" : "No records yet"}</td></tr>`;
}
