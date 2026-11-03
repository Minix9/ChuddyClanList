// ═══════════════════════════════════════════════════════════════════════════════
// DEMON DETAIL — hero, stats, verification video, records
// ═══════════════════════════════════════════════════════════════════════════════
function playerLink(name) {
    return `#/player/${encodeURIComponent(name)}`;
}

function statCard(iconName, tone, value, label) {
    return `<div class="stat-card">
      <div class="stat-icon ${tone}">${icon(iconName)}</div>
      <div class="stat-text"><div class="stat-val">${value}</div><div class="stat-lbl">${label}</div></div>
    </div>`;
}

function recordRow(d, r, pos) {
    const dateStr = formatShortDate(r.createdAt);
    const watch = r.video
        ? `<button class="watch-icon-btn" data-video="${esc(r.video)}" data-title="${esc(`${d.name} — ${r.player}`)}" title="Watch completion" aria-label="Watch completion">${icon("play")}</button>`
        : "";
    const meta = [
        r.attempts ? `<span class="meta" title="Attempts">${icon("repeat")}${r.attempts.toLocaleString()}</span>` : "",
        dateStr ? `<span class="meta" title="Date added">${icon("calendar")}${dateStr}</span>` : "",
    ].join("");
    return `
      <div class="record-row">
        <div class="record-left">
          <span class="record-pos">${pos}</span>
          ${flagHTML(r.flag)}
          <div class="record-who">
            <div class="record-name-line">
              <a class="rec-player" href="${esc(playerLink(r.player))}">${esc(r.player)}</a>
              ${r.isFirstVictor ? `<span class="badge badge-first" title="First to beat this level">${icon("crown")}First</span>` : ""}
            </div>
            ${meta ? `<div class="record-meta">${meta}</div>` : ""}
          </div>
        </div>
        <div class="record-right">
          ${watch}
          <span class="pct ${r.pct === 100 ? "full" : ""}">${r.pct}%</span>
        </div>
      </div>`;
}

function selectDemon(rank) {
    const d = getDemon(rank);
    if (!d) return false;
    const changed = currentRank !== rank;
    currentRank = rank;

    setSidebarActive(rank);
    document.getElementById("emptyState").hidden = true;
    const detail = document.getElementById("demonDetail");
    detail.hidden = false;

    // Re-rendering would restart the embedded video, so skip if nothing changed
    if (!changed && detail.childElementCount) return true;

    const completions = d.records.filter((r) => r.pct === 100);
    const progress = d.records.filter((r) => r.pct < 100);
    const firstVictor = d.records.find((r) => r.isFirstVictor);
    const idx = DEMONS.indexOf(d);
    const prev = DEMONS[idx - 1];
    const next = DEMONS[idx + 1];

    let recsHTML = "";
    if (completions.length) {
        recsHTML += `<div class="records-group-label">Completions</div>` + completions.map((r, i) => recordRow(d, r, i + 1)).join("");
    }
    if (progress.length) {
        recsHTML += `<div class="records-group-label">In progress</div>` + progress.map((r, i) => recordRow(d, r, i + 1)).join("");
    }
    if (!d.records.length) recsHTML = `<div class="no-records">${icon("trophy")}No records yet — be the first!</div>`;

    const firstVictorHTML = firstVictor
        ? `<a href="${esc(playerLink(firstVictor.player))}">${esc(firstVictor.player)}</a>`
        : `<span class="muted">—</span>`;

    detail.innerHTML = `
    <div class="hero">
      <div class="hero-bg"></div>
      <div class="hero-inner">
        <div class="hero-top">
          <div class="hero-crumb">Level <strong>${rank}</strong> of ${DEMONS.length}</div>
          <div class="hero-nav">
            <button class="icon-btn" ${prev ? `data-demon="${prev.rank}" title="Previous: ${esc(prev.name)}"` : "disabled"} aria-label="Previous level">${icon("chevron-left")}</button>
            <button class="icon-btn" ${next ? `data-demon="${next.rank}" title="Next: ${esc(next.name)}"` : "disabled"} aria-label="Next level">${icon("chevron-right")}</button>
          </div>
        </div>
        <div class="hero-content">
          ${
              d.video
                  ? `<button class="hero-thumb" data-video="${esc(d.video)}" data-title="${esc(d.name)} — verification" aria-label="Play verification video">
            <img src="${youtubeThumb(d.video)}" alt="" />
            <span class="hero-thumb-play">${icon("play")}</span>
          </button>`
                  : `<div class="hero-thumb hero-thumb-empty">${icon("video")}</div>`
          }
          <div class="hero-main">
            <div class="hero-rank"><span class="hero-rank-num ${rankClass(rank) || "rank-plain"}">#${rank}</span></div>
            <h1 class="hero-title">${esc(d.name)}</h1>
            <div class="hero-by">by <strong>${esc(d.creator)}</strong></div>
          </div>
          ${d.video ? `<a class="btn btn-primary hero-watch" href="https://youtu.be/${encodeURIComponent(d.video)}" target="_blank" rel="noopener">${icon("external")}YouTube</a>` : ""}
        </div>
      </div>
    </div>

    <div class="detail-stats stat-grid">
      ${statCard("star", "gold", calcScore(d.rank, 100), "Points")}
      ${statCard("check-circle", "green", completions.length, `Completion${completions.length !== 1 ? "s" : ""}`)}
      ${statCard("crown", "gold", firstVictorHTML, "First victor")}
      ${statCard("users", "neutral", d.records.length, "Records")}
    </div>

    <div class="detail-body">
      <div>
        <div class="section-label">${icon("video")} Verification</div>
        ${
            d.video
                ? `<div class="video-container">
          <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.video)}?rel=0&modestbranding=1"
            allowfullscreen loading="lazy" title="${esc(d.name)} verification"></iframe>
        </div>`
                : `<div class="no-records">${icon("video")}No verification video for this level yet</div>`
        }
      </div>
      <div class="card">
        <div class="card-head">
          <div class="section-label">${icon("trophy")} Records <span class="count">${d.records.length}</span></div>
        </div>
        <div class="card-body">${recsHTML}</div>
      </div>
    </div>`;
    // Set via the style API rather than an inline attribute so odd video IDs can't break the markup
    detail.querySelector(".hero-bg").style.backgroundImage = heroBackground(d);

    document.getElementById("mainArea").scrollTop = 0;
    return true;
}
