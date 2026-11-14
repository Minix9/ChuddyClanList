// ═══════════════════════════════════════════════════════════════════════════════
// HOME — greeting, official links, quick stats, the top 3 levels, members and links
// ═══════════════════════════════════════════════════════════════════════════════
function renderHome() {
    const challenges = DEMONS.filter((d) => d.challenge).length;
    document.getElementById("homeStats").innerHTML = [
        statCard("layers", "", DEMONS.length, "Levels"),
        statCard("skull", "", DEMONS.length - challenges, "Demons"),
        statCard("zap", "blue", challenges, "Challenges"),
        statCard("users", "neutral", getPlayerStats().length, "Players"),
    ].join("");

    document.getElementById("homeTop").innerHTML = DEMONS.slice(0, 3)
        .map(
            (d) => `
      <a class="card home-top-item" href="#/demon/${d.rank}">
        ${d.video ? `<img src="${youtubeThumb(d.video, "mqdefault")}" alt="" loading="lazy" />` : `<span class="home-top-noimg">${icon("video")}</span>`}
        <span class="home-top-text">
          <span class="d-rank ${rankClass(d.rank)}">${d.rank}</span>
          <span class="home-top-name">${esc(d.name)}</span>
          ${typeTag(d)}
        </span>
      </a>`,
        )
        .join("");

    // Members, highest points first
    document.getElementById("homeMembers").innerHTML = CLAN_MEMBERS.map((m) => ({ m, p: getPlayer(m.name) }))
        .sort((a, b) => (b.p?.pts || 0) - (a.p?.pts || 0))
        .map(
            ({ m, p }) => `
      <div class="card home-member">
        <a class="home-member-main" href="#/player/${encodeURIComponent(m.name)}">
          ${flagHTML(p?.flag)}
          <span class="home-member-text"><strong>${esc(m.name)}</strong><small>${(p?.pts || 0).toLocaleString()} pts</small></span>
        </a>
        <a class="icon-btn" href="${esc(m.youtube)}" target="_blank" rel="noopener" title="${esc(m.name)} on YouTube" aria-label="${esc(m.name)} on YouTube">${icon("youtube")}</a>
      </div>`,
        )
        .join("");
}
