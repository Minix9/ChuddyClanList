// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function profileLevelRow(d, rec) {
    const watchVideo = rec && (rec.video || d.video);
    const watchBtn = watchVideo
        ? `<button class="watch-icon-btn" data-video="${esc(watchVideo)}" data-title="${esc(d.name)}" title="${rec.video ? "Watch completion" : "Watch verification"}" aria-label="Watch video">${icon("play")}</button>`
        : "";
    const badge = rec ? recordBadge(rec.verifier, rec.isFirstVictor, true) : "";
    // Points earned from this record, or what the level is worth if not beaten yet
    const possible = calcScore(d.rank, 100);
    const pts = rec
        ? `<span class="pts" title="${rec.pct < 100 ? `${possible.toLocaleString()} pts at 100%` : "Points earned"}">+${calcScore(d.rank, rec.pct).toLocaleString()} pts</span>`
        : `<span class="pts muted" title="Points for beating this level">${possible.toLocaleString()} pts</span>`;
    const pct = rec ? `<span class="pct ${rec.pct === 100 ? "full" : ""}">${rec.pct}%</span>` : "";

    return `<li class="row${rec ? "" : " dim"}" data-demon="${d.rank}">
      <span class="row-rank">#${d.rank}</span>
      ${typeTag(d)}
      <span class="row-main">
        <span class="row-title">${esc(d.name)}</span>
        <span class="row-sub">by ${esc(d.creator)}${rec?.attempts ? ` · ${rec.attempts.toLocaleString()} attempts` : ""}</span>
      </span>
      <span class="row-end">${badge}${watchBtn}${pts}${pct}</span>
    </li>`;
}

// Total points of a set of levels, at the percentage pctOf(level) returns
function sumPts(levels, pctOf) {
    return levels.reduce((s, d) => s + calcScore(d.rank, pctOf(d)), 0);
}

// Last opened tab (Completed / In progress / Not beaten), kept between profiles
let profilePane = "completed";

function profileTab(pane, title, count, ptsText) {
    return `<button class="detail-tab" role="tab" data-pane="${pane}">${title} <span class="count">${count}</span><span class="tab-pts">${ptsText}</span></button>`;
}

function profilePaneHTML(pane, levels, emptyText, rec) {
    return `<div class="detail-pane records-pane" role="tabpanel" data-pane="${pane}">
      ${levels.length ? `<ol class="rows">${levels.map((d) => profileLevelRow(d, rec(d))).join("")}</ol>` : `<div class="no-records">${emptyText}</div>`}
    </div>`;
}

// Returns false if the player doesn't exist
function renderProfilePage(playerName) {
    const el = document.getElementById("profileTab");
    const player = getPlayer(playerName);
    if (!player) {
        el.innerHTML = `<div class="page">
        <div class="empty-state">
          <div class="empty-icon">${icon("user")}</div>
          <h2>Player not found</h2>
          <p class="empty-sub">No records exist for “${esc(playerName)}”.</p>
        </div></div>`;
        return false;
    }

    const recs = player.records;
    const completed = DEMONS.filter((d) => recs[d.rank]?.pct === 100);
    const partial = DEMONS.filter((d) => recs[d.rank] && recs[d.rank].pct < 100);
    const unbeaten = DEMONS.filter((d) => !recs[d.rank]);
    const completionPct = DEMONS.length ? Math.round((completed.length / DEMONS.length) * 100) : 0;
    const firsts = completed.filter((d) => recs[d.rank].isFirstVictor).length;
    const verified = DEMONS.filter((d) => recs[d.rank]?.verifier).length;
    const member = clanMember(player.name);
    const demonsDone = completed.filter((d) => !d.challenge).length;
    const pts = (levels, pctOf) => `${sumPts(levels, pctOf).toLocaleString()} pts`;
    const recOf = (d) => recs[d.rank];

    el.innerHTML = `<div class="page">
    <div class="profile-head">
      <div class="profile-id">
        <span class="profile-flag">${flagHTML(player.flag)}</span>
        <div>
          <div class="profile-name-row">
            <h1>${esc(player.name)}</h1>
            ${member ? `<span class="badge badge-accent">Clan member</span>` : ""}
          </div>
          <div class="profile-sub">
            <span>Rank ${player.position} of ${getPlayerStats().length}</span>
            ${player.hardest ? `<span>Hardest: <a class="text-link" href="${levelHref(player.hardest.rank)}">#${player.hardest.rank} ${esc(player.hardest.name)}</a></span>` : ""}
            ${verified ? `<span>${verified} verification${verified !== 1 ? "s" : ""}</span>` : ""}
            ${firsts ? `<span>${firsts} first victor${firsts !== 1 ? "ies" : "y"}</span>` : ""}
          </div>
        </div>
      </div>
      ${member ? `<a class="btn btn-ghost btn-sm" href="${esc(member.youtube)}" target="_blank" rel="noopener">${icon("youtube")}YouTube</a>` : ""}
    </div>

    <dl class="stats">
      ${stat("Points", player.pts.toLocaleString())}
      ${stat("Completions", completed.length)}
      ${stat(demonsDone === 1 ? "Demon" : "Demons", demonsDone)}
      ${stat(completed.length - demonsDone === 1 ? "Challenge" : "Challenges", completed.length - demonsDone)}
    </dl>

    <div class="profile-progress">
      <div class="profile-progress-head">
        <span>List progress</span>
        <span><span class="mono">${completed.length} / ${DEMONS.length}</span> · ${completionPct}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${completionPct}%"></div></div>
    </div>

    <div class="fit-fill">
      <div class="detail-tabs" role="tablist">
        ${profileTab("completed", "Completed", completed.length, pts(completed, (d) => recs[d.rank].pct))}
        ${profileTab("partial", "In progress", partial.length, pts(partial, (d) => recs[d.rank].pct))}
        ${profileTab("unbeaten", "Not beaten", unbeaten.length, `${pts(unbeaten, () => 100)} left`)}
      </div>
      ${profilePaneHTML("completed", completed, "No completions yet", recOf)}
      ${profilePaneHTML("partial", partial, "No partial records", recOf)}
      ${profilePaneHTML("unbeaten", unbeaten, "List fully cleared!", () => null)}
    </div></div>`;
    initTabs(el, profilePane, (p) => (profilePane = p));
    return true;
}
