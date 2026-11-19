// ═══════════════════════════════════════════════════════════════════════════════
// DEMON DETAIL — header with stats, verification video / records tabs
// ═══════════════════════════════════════════════════════════════════════════════
function recordRow(d, r, pos) {
    const dateStr = formatShortDate(r.createdAt);
    const sub = [r.attempts ? `${r.attempts.toLocaleString()} attempts` : "", dateStr].filter(Boolean).join(" · ");
    const watch = r.video
        ? `<button class="watch-icon-btn" data-video="${esc(r.video)}" data-title="${esc(`${d.name} — ${r.player}`)}" title="Watch completion" aria-label="Watch completion">${icon("play")}</button>`
        : "";
    return `
      <li class="row">
        <span class="row-rank">${pos}</span>
        ${flagHTML(r.flag)}
        <span class="row-main">
          <span class="row-title"><a class="text-link" href="${esc(playerHref(r.player))}">${esc(r.player)}</a>
          ${recordBadge(r.verifier, r.isFirstVictor)}</span>
          ${sub ? `<span class="row-sub">${sub}</span>` : ""}
        </span>
        <span class="row-end">${watch}<span class="pct ${r.pct === 100 ? "full" : ""}">${r.pct}%</span></span>
      </li>`;
}

// Verification or records — stays the same while browsing between levels
let detailPane = "video";

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

    // The verifier gets their own section above the completions (hidden when there is none)
    const verifiers = d.records.filter((r) => r.verifier);
    const completions = d.records.filter((r) => r.pct === 100 && !r.verifier);
    const progress = d.records.filter((r) => r.pct < 100 && !r.verifier);
    const firstVictor = d.records.find((r) => r.isFirstVictor);
    const idx = DEMONS.indexOf(d);
    const prev = DEMONS[idx - 1];
    const next = DEMONS[idx + 1];

    const group = (title, list) =>
        list.length ? `<li class="row-group label">${title}</li>` + list.map((r, i) => recordRow(d, r, i + 1)).join("") : "";
    const recsHTML = d.records.length
        ? `<ol class="rows">${group(verifiers.length > 1 ? "Verifiers" : "Verifier", verifiers)}${group("Completions", completions)}${group("In progress", progress)}</ol>`
        : `<div class="no-records">${icon("trophy")}No records yet — be the first!</div>`;

    const levelIdHTML = d.levelId
        ? `<button class="copy-id" data-copy="${esc(d.levelId)}" title="Copy level ID">${esc(d.levelId)}${icon("copy")}</button>`
        : `<span class="muted">—</span>`;
    const playerLinks = (list) => list.map((r) => `<a href="${esc(playerHref(r.player))}">${esc(r.player)}</a>`).join(", ");
    const victorStat = verifiers.length
        ? stat(verifiers.length > 1 ? "Verifiers" : "Verifier", playerLinks(verifiers))
        : stat("First victor", firstVictor ? playerLinks([firstVictor]) : `<span class="muted">—</span>`);

    detail.innerHTML = `
    <div class="hero">
      <div class="hero-bg"></div>
      <div class="hero-inner">
        <div class="hero-top">
          <span>Level <strong>${rank}</strong> of ${DEMONS.length}</span>
          <div class="hero-nav">
            <button class="icon-btn" ${prev ? `data-demon="${prev.rank}" title="Previous: ${esc(prev.name)}"` : "disabled"} aria-label="Previous level">${icon("chevron-left")}</button>
            <button class="icon-btn" ${next ? `data-demon="${next.rank}" title="Next: ${esc(next.name)}"` : "disabled"} aria-label="Next level">${icon("chevron-right")}</button>
          </div>
        </div>
        <div class="hero-content">
          <div class="hero-main">
            <div class="hero-tags"><span class="${rankClass(rank)}">#${rank}</span>${typeTag(d, true)}</div>
            <h1 class="hero-title">${esc(d.name)}</h1>
            <div class="hero-by">by <strong>${esc(d.creator)}</strong></div>
            <dl class="stats">
              ${stat("Points", calcScore(d.rank, 100))}
              ${stat(completionCount(d) === 1 ? "Completion" : "Completions", completionCount(d))}
              ${victorStat}
              ${stat("Level ID", levelIdHTML)}
            </dl>
          </div>
          ${d.video ? `<a class="btn btn-ghost" href="https://youtu.be/${encodeURIComponent(d.video)}" target="_blank" rel="noopener">${icon("youtube")}YouTube</a>` : ""}
        </div>
      </div>
    </div>

    <div class="detail-body">
      <div class="detail-tabs" role="tablist">
        <button class="detail-tab" role="tab" data-pane="video">Verification</button>
        <button class="detail-tab" role="tab" data-pane="records">Records <span class="count">${d.records.length}</span></button>
      </div>
      <div class="detail-pane video-pane" role="tabpanel" data-pane="video">
        ${
            d.video
                ? `<div class="video-container">
          <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.video)}?rel=0&modestbranding=1"
            allowfullscreen loading="lazy" title="${esc(d.name)} verification"></iframe>
        </div>`
                : `<div class="no-records">${icon("video")}No verification video for this level yet</div>`
        }
      </div>
      <div class="detail-pane records-pane" role="tabpanel" data-pane="records">${recsHTML}</div>
    </div>`;
    initTabs(detail, detailPane, (p) => (detailPane = p));
    // Set via the style API rather than an inline attribute so odd video IDs can't break the markup
    detail.querySelector(".hero-bg").style.backgroundImage = heroBackground(d);

    document.getElementById("mainArea").scrollTop = 0;
    return true;
}
