// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function profileLevelRow(d, statusClass, pctClass, pctText, rec) {
    const showWatch = !!rec && !!(rec.video || d.video);
    const watchBtn = showWatch
        ? `<button class="watch-icon-btn" data-video="${esc(rec.video || d.video)}" data-title="${esc(d.name)}" title="${rec.video ? "Watch completion" : "Watch verification"}" aria-label="Watch video">${icon("play")}</button>`
        : "";
    const crown = rec?.isFirstVictor ? `<span class="badge badge-first" title="First to beat this level">${icon("crown")}</span>` : "";
    const pct = pctText ? `<span class="pct ${pctClass}">${pctText}</span>` : "";

    return `<div class="level-row ${statusClass}" data-demon="${d.rank}">
      <div class="level-row-left">
        <span class="rank-num">#${d.rank}</span>
        <div class="level-row-text">
          <div class="level-row-name">${esc(d.name)}</div>
          <div class="level-row-creator">by ${esc(d.creator)}${rec?.attempts ? ` · ${rec.attempts.toLocaleString()} att.` : ""}</div>
        </div>
      </div>
      <div class="level-row-right">
        ${crown}
        ${watchBtn}
        ${pct}
      </div>
    </div>`;
}

function profileColumn(iconName, iconCls, title, items, emptyText, rowFn) {
    return `<div class="card profile-col">
      <div class="card-head">
        <div class="section-label">${icon(iconName, iconCls)} ${title} <span class="count">${items.length}</span></div>
      </div>
      <div class="card-body">
        ${items.length ? items.map(rowFn).join("") : `<div class="no-records">${emptyText}</div>`}
      </div>
    </div>`;
}

// Returns false if the player doesn't exist
function renderProfilePage(playerName) {
    const el = document.getElementById("profileTab");
    const player = getPlayer(playerName);
    const back = `<button class="btn btn-ghost btn-sm back-btn" onclick="backFromProfile()">${icon("arrow-left")}Back</button>`;

    if (!player) {
        el.innerHTML = `<div class="page">
        ${back}
        <div class="empty-state">
          <div class="empty-icon">${icon("user")}</div>
          <div class="empty-title">Player not found</div>
          <div class="empty-sub">No records exist for “${esc(playerName)}”.</div>
        </div></div>`;
        return false;
    }

    const recs = player.records;
    const completed = DEMONS.filter((d) => recs[d.rank]?.pct === 100);
    const partial = DEMONS.filter((d) => recs[d.rank] && recs[d.rank].pct < 100);
    const unbeaten = DEMONS.filter((d) => !recs[d.rank]);
    const completionPct = DEMONS.length ? Math.round((completed.length / DEMONS.length) * 100) : 0;
    const totalPlayers = getPlayerStats().length;
    const firsts = completed.filter((d) => recs[d.rank].isFirstVictor).length;

    el.innerHTML = `<div class="page">
    ${back}

    <div class="card profile-header">
      <div class="profile-avatar">${flagHTML(player.flag)}</div>
      <div>
        <h1 class="profile-name">${esc(player.name)}</h1>
        <div class="profile-sub">
          <span class="meta">${icon("trophy")}Rank ${player.position} of ${totalPlayers}</span>
          ${player.hardest ? `<span class="meta">${icon("skull")}Hardest: #${player.hardest.rank} ${esc(player.hardest.name)}</span>` : ""}
          ${firsts ? `<span class="meta">${icon("crown")}${firsts} first victor${firsts !== 1 ? "ies" : "y"}</span>` : ""}
        </div>
      </div>
    </div>

    <div class="stat-grid profile-stats">
      ${statCard("trophy", "gold", `#${player.position}`, "Leaderboard")}
      ${statCard("star", "", player.pts.toLocaleString(), "Points")}
      ${statCard("check-circle", "green", completed.length, "Completions")}
      ${statCard("half-circle", "neutral", partial.length, "In progress")}
    </div>

    <div class="card profile-progress">
      <div class="profile-progress-head">
        <span>List progress</span>
        <span><span class="mono">${completed.length} / ${DEMONS.length}</span> · ${completionPct}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${completionPct}%"></div></div>
    </div>

    <div class="profile-columns">
      ${profileColumn("check-circle", "col-icon-done", "Completed", completed, "No completions yet", (d) =>
          profileLevelRow(d, "completed", "full", "100%", recs[d.rank]),
      )}
      ${profileColumn("half-circle", "col-icon-progress", "In progress", partial, "No partial records", (d) =>
          profileLevelRow(d, "partial", "", recs[d.rank].pct + "%", recs[d.rank]),
      )}
      ${profileColumn("circle", "", "Not beaten", unbeaten, "List fully cleared!", (d) =>
          profileLevelRow(d, "unbeaten", "", "", null),
      )}
    </div></div>`;
    return true;
}

function backFromProfile() {
    if (hasAppHistory) history.back();
    else location.hash = "#/leaderboard";
}
