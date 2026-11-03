// ═══════════════════════════════════════════════════════════════════════════════
// DEMON DETAIL — hero, verification video, records
// ═══════════════════════════════════════════════════════════════════════════════
function playerLink(name) {
    return `#/player/${encodeURIComponent(name)}`;
}

function recordRow(d, r) {
    const dateStr = formatShortDate(r.createdAt);
    const watch = r.video
        ? `<button class="watch-icon-btn" data-video="${esc(r.video)}" data-title="${esc(`${d.name} — ${r.player}`)}" title="Watch completion">▶</button>`
        : "";
    return `
      <div class="record-row">
        <span class="record-left">
          <span class="rec-flag">${esc(r.flag)}</span>
          <a class="rec-player" href="${esc(playerLink(r.player))}">${esc(r.player)}</a>
          ${r.isFirstVictor ? '<span class="first-victor-badge" title="First to beat this level">👑 1st</span>' : ""}
          ${r.attempts ? `<span class="rec-attempts">${r.attempts.toLocaleString()} att.</span>` : ""}
          ${dateStr ? `<span class="rec-date">${dateStr}</span>` : ""}
        </span>
        <span class="record-right">
          ${watch}
          <span class="pct ${r.pct === 100 ? "full" : ""}">${r.pct}%</span>
        </span>
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
    const demonPts = calcScore(d.rank, 100);
    const idx = DEMONS.indexOf(d);
    const prev = DEMONS[idx - 1];
    const next = DEMONS[idx + 1];

    let recsHTML = completions.map((r) => recordRow(d, r)).join("");
    if (progress.length) {
        recsHTML += `<div class="records-divider">In progress</div>` + progress.map((r) => recordRow(d, r)).join("");
    }
    if (!d.records.length) recsHTML = `<div class="no-records">No records yet — be the first!</div>`;

    detail.innerHTML = `
    <div class="hero">
      <div class="hero-bg"></div>
      <div class="hero-vignette"></div>
      <div class="hero-side-vignette"></div>
      <div class="hero-nav">
        <button ${prev ? `data-demon="${prev.rank}" title="${esc(prev.name)}"` : "disabled"}>← #${prev ? prev.rank : "–"}</button>
        <button ${next ? `data-demon="${next.rank}" title="${esc(next.name)}"` : "disabled"}>#${next ? next.rank : "–"} →</button>
      </div>
      <div class="hero-rank-watermark">#${rank}</div>
      <div class="hero-content">
        <div>
          <div class="hero-title">${esc(d.name)}</div>
          <div class="hero-chips">
            <span class="chip chip-rank ${rankClass(rank) || "rank-plain"}">Rank #${rank}</span>
            <span class="chip chip-creator">by ${esc(d.creator)}</span>
            <span class="chip chip-count">${completions.length} completion${completions.length !== 1 ? "s" : ""}</span>
            <span class="chip chip-pts">⭐ ${demonPts} pts</span>
          </div>
        </div>
        ${d.video ? `<a class="watch-btn" href="https://youtu.be/${encodeURIComponent(d.video)}" target="_blank" rel="noopener">▶ Watch on YouTube</a>` : ""}
      </div>
    </div>
    <div class="detail-body">
      <div>
        <div class="section-label">Verification Video</div>
        ${
            d.video
                ? `<div class="video-container">
          <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.video)}?rel=0&modestbranding=1"
            allowfullscreen loading="lazy" title="${esc(d.name)} verification"></iframe>
        </div>`
                : `<div class="no-records">No verification video for this level yet</div>`
        }
      </div>
      <div class="records-col">
        <div class="section-label">Records<span class="count">${d.records.length}</span></div>
        <div class="records-list">${recsHTML}</div>
      </div>
    </div>`;
    // Set via the style API rather than an inline attribute so odd video IDs can't break the markup
    detail.querySelector(".hero-bg").style.backgroundImage = heroBackground(d);

    document.getElementById("mainArea").scrollTop = 0;
    return true;
}
