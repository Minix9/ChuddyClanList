// ═══════════════════════════════════════════════════════════════════════════════
// HOME — greeting, quick stats, the top 3 levels and links to the other pages
// ═══════════════════════════════════════════════════════════════════════════════
function renderHome() {
    const challenges = DEMONS.filter((d) => d.challenge).length;
    document.getElementById("homeStats").innerHTML = [
        statCard("layers", "", DEMONS.length, "Levels"),
        statCard("skull", "", DEMONS.length - challenges, "Demons"),
        statCard("zap", "gold", challenges, "Challenges"),
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
}
