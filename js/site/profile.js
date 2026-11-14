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
    // Points earned from this record, or what the level is worth if not beaten yet
    const possible = calcScore(d.rank, 100);
    const pts = rec
        ? `<span class="level-pts" title="${rec.pct < 100 ? `${possible.toLocaleString()} pts at 100%` : "Points earned"}">+${calcScore(d.rank, rec.pct).toLocaleString()} pts</span>`
        : `<span class="level-pts muted" title="Points for beating this level">${possible.toLocaleString()} pts</span>`;

    return `<div class="level-row ${statusClass}" data-demon="${d.rank}">
      <div class="level-row-left">
        <span class="rank-num">#${d.rank}</span>
        ${typeTag(d)}
        <div class="level-row-text">
          <div class="level-row-name">${esc(d.name)}</div>
          <div class="level-row-creator">by ${esc(d.creator)}${rec?.attempts ? ` · ${rec.attempts.toLocaleString()} att.` : ""}</div>
        </div>
      </div>
      <div class="level-row-right">
        ${crown}
        ${watchBtn}
        ${pts}
        ${pct}
      </div>
    </div>`;
}

// Total points of a set of levels, at the percentage pctOf(level) returns
function sumPts(levels, pctOf) {
    return levels.reduce((s, d) => s + calcScore(d.rank, pctOf(d)), 0);
}

// Last opened tab (Completed / In progress / Not beaten), kept between profiles
let profilePane = "completed";

function profileTab(pane, iconName, title, count, ptsText) {
    return `<button class="detail-tab" role="tab" data-pane="${pane}">${icon(iconName)}${title} <span class="count">${count}</span><span class="tab-pts">${ptsText}</span></button>`;
}

function profilePaneHTML(pane, items, emptyText, rowFn) {
    return `<div class="detail-pane records-pane" role="tabpanel" data-pane="${pane}">
      ${items.length ? items.map(rowFn).join("") : `<div class="no-records">${emptyText}</div>`}
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

    const member = clanMember(player.name);
    const demonsDone = completed.filter((d) => !d.challenge).length;
    const pts = (levels, pctOf) => `${sumPts(levels, pctOf).toLocaleString()} pts`;

    el.innerHTML = `<div class="page">
    <div class="card profile-header">
      <div class="profile-avatar">${flagHTML(player.flag)}</div>
      <div class="profile-id">
        <div class="profile-name-row">
          <h1 class="profile-name">${esc(player.name)}</h1>
          ${member ? `<span class="badge badge-member" title="Chuddy Clan member">${icon("users")}Member</span>` : ""}
        </div>
        <div class="profile-sub">
          <span class="meta">${icon("trophy")}Rank ${player.position} of ${totalPlayers}</span>
          ${player.hardest ? `<span class="meta">${icon("skull")}Hardest: #${player.hardest.rank} ${esc(player.hardest.name)}</span>` : ""}
          ${firsts ? `<span class="meta">${icon("crown")}${firsts} first victor${firsts !== 1 ? "ies" : "y"}</span>` : ""}
        </div>
      </div>
      <div class="profile-actions">
        ${member ? `<a class="btn btn-ghost btn-sm" href="${esc(member.youtube)}" target="_blank" rel="noopener">${icon("youtube")}YouTube</a>` : ""}
        ${back}
      </div>
      <div class="profile-progress">
        <div class="profile-progress-head">
          <span>List progress</span>
          <span><span class="mono">${completed.length} / ${DEMONS.length}</span> · ${completionPct}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${completionPct}%"></div></div>
      </div>
    </div>

    <div class="stat-grid profile-stats">
      ${statCard("star", "gold", player.pts.toLocaleString(), "Points")}
      ${statCard("check-circle", "green", completed.length, "Completions")}
      ${statCard("skull", "", demonsDone, `Demon${demonsDone !== 1 ? "s" : ""}`)}
      ${statCard("zap", "blue", completed.length - demonsDone, `Challenge${completed.length - demonsDone !== 1 ? "s" : ""}`)}
    </div>

    <div class="card fit-fill">
      <div class="detail-tabs" role="tablist">
        ${profileTab("completed", "check-circle", "Completed", completed.length, pts(completed, (d) => recs[d.rank].pct))}
        ${profileTab("partial", "half-circle", "In progress", partial.length, pts(partial, (d) => recs[d.rank].pct))}
        ${profileTab("unbeaten", "circle", "Not beaten", unbeaten.length, `${pts(unbeaten, () => 100)} left`)}
      </div>
      ${profilePaneHTML("completed", completed, "No completions yet", (d) => profileLevelRow(d, "completed", "full", "100%", recs[d.rank]))}
      ${profilePaneHTML("partial", partial, "No partial records", (d) => profileLevelRow(d, "partial", "", recs[d.rank].pct + "%", recs[d.rank]))}
      ${profilePaneHTML("unbeaten", unbeaten, "List fully cleared!", (d) => profileLevelRow(d, "unbeaten", "", "", null))}
    </div></div>`;
    initTabs(el, profilePane, (p) => (profilePane = p));
    return true;
}

function backFromProfile() {
    if (hasAppHistory) history.back();
    else location.hash = "#/leaderboard";
}
