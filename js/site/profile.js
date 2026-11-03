// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function profileLevelRow(d, statusClass, badgeClass, badgeText, rec) {
    const showWatch = !!rec;
    const watchBtn = showWatch
        ? `<button class="watch-icon-btn" data-video="${esc(rec.video || d.video)}" data-title="${esc(d.name)}" title="${rec.video ? "Watch completion" : "Watch verification"}">▶</button>`
        : "";
    const crown = rec?.isFirstVictor ? `<span class="first-victor-badge" title="First to beat this level">👑 1st</span>` : "";
    const attemptsTxt = rec?.attempts ? `<span class="rec-attempts">${rec.attempts.toLocaleString()} att.</span>` : "";

    return `<div class="profile-level-row ${statusClass}" data-demon="${d.rank}">
      <div class="profile-level-left">
        <span class="profile-level-rank">#${d.rank}</span>
        <div class="profile-level-text">
          <div class="profile-level-name">${esc(d.name)}</div>
          <div class="profile-level-creator">by ${esc(d.creator)}</div>
        </div>
      </div>
      <div class="profile-level-right">
        ${crown}
        ${attemptsTxt}
        ${watchBtn}
        <span class="profile-level-badge ${badgeClass}">${badgeText}</span>
      </div>
    </div>`;
}

function profileColumn(title, items, emptyText, rowFn) {
    return `<div class="profile-page-col">
      <div class="section-label">${title}<span class="count">${items.length}</span></div>
      <div class="profile-level-grid">
        ${items.length ? items.map(rowFn).join("") : `<div class="no-records">${emptyText}</div>`}
      </div>
    </div>`;
}

// Returns false if the player doesn't exist
function renderProfilePage(playerName) {
    const el = document.getElementById("profileTab");
    const player = getPlayer(playerName);

    if (!player) {
        el.innerHTML = `
        <button class="ghost-btn back-btn" onclick="backFromProfile()">← Back</button>
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <div class="empty-title">Player not found</div>
          <div class="empty-sub">No records exist for “${esc(playerName)}”.</div>
        </div>`;
        return false;
    }

    const recs = player.records;
    const completed = DEMONS.filter((d) => recs[d.rank]?.pct === 100);
    const partial = DEMONS.filter((d) => recs[d.rank] && recs[d.rank].pct < 100);
    const unbeaten = DEMONS.filter((d) => !recs[d.rank]);
    const completionPct = DEMONS.length ? Math.round((completed.length / DEMONS.length) * 100) : 0;
    const totalPlayers = getPlayerStats().length;
    const hardest = player.hardest ? `Hardest: #${player.hardest.rank} ${esc(player.hardest.name)}` : "No completions yet";

    el.innerHTML = `
    <button class="ghost-btn back-btn" onclick="backFromProfile()">← Back</button>

    <div class="profile-page-header">
      <div class="profile-page-avatar">${esc(player.flag)}</div>
      <div>
        <div class="profile-page-name">${esc(player.name)}</div>
        <div class="profile-page-sub">Ranked #${player.position} of ${totalPlayers} on the Chuddy List · ${hardest}</div>
      </div>
    </div>

    <div class="profile-page-stats">
      <div class="stat-card"><div class="stat-val gold">#${player.position}</div><div class="stat-lbl">Leaderboard</div></div>
      <div class="stat-card"><div class="stat-val">${player.pts}</div><div class="stat-lbl">Points</div></div>
      <div class="stat-card"><div class="stat-val green">${completed.length}</div><div class="stat-lbl">Completions</div></div>
      <div class="stat-card"><div class="stat-val">${completionPct}%</div><div class="stat-lbl">List Done</div></div>
    </div>
    <div class="progress-track profile-progress" title="${completed.length} of ${DEMONS.length} levels completed">
      <div class="progress-fill" style="width:${completionPct}%"></div>
    </div>

    <div class="profile-page-columns">
      ${profileColumn("✓ Completed", completed, "No completions yet", (d) =>
          profileLevelRow(d, "completed", "badge-complete", "100%", recs[d.rank]),
      )}
      ${profileColumn("◔ In Progress", partial, "No partial records", (d) =>
          profileLevelRow(d, "partial", "badge-partial", recs[d.rank].pct + "%", recs[d.rank]),
      )}
      ${profileColumn("○ Not Beaten", unbeaten, "List fully cleared! 🎉", (d) =>
          profileLevelRow(d, "unbeaten", "badge-none", "—", null),
      )}
    </div>`;
    return true;
}

function backFromProfile() {
    if (hasAppHistory) history.back();
    else location.hash = "#/leaderboard";
}
