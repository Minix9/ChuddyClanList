// ═══════════════════════════════════════════════════════════════════════════════
// HOME — answers what people come to check: what's hardest, who's on top,
// what happened lately and who's in the clan
// ═══════════════════════════════════════════════════════════════════════════════
function renderHome() {
    const challenges = DEMONS.filter((d) => d.challenge).length;
    document.getElementById("homeStats").innerHTML = [
        stat("Levels", DEMONS.length),
        stat("Demons", DEMONS.length - challenges),
        stat("Challenges", challenges),
        stat("Players", getPlayerStats().length),
    ].join("");

    // Latest changelog entry
    const latest = CHANGELOG[0];
    const update = document.getElementById("homeUpdate");
    update.hidden = !latest;
    if (latest) {
        update.innerHTML = `<span class="badge badge-accent">Update</span>${esc(changelogDate(latest.published_on))} —
            <strong>${esc(latest.title)}</strong> →`;
    }

    document.getElementById("homeTop").innerHTML = DEMONS.slice(0, 5)
        .map(
            (d) => `<li><a class="row" href="${levelHref(d.rank)}">
        <span class="row-rank ${rankClass(d.rank)}">${d.rank}</span>
        ${d.video ? `<img class="row-thumb" src="${youtubeThumb(d.video, "mqdefault")}" alt="" loading="lazy" />` : `<span class="row-thumb"></span>`}
        <span class="row-main"><span class="row-title">${esc(d.name)}</span><span class="row-sub">by ${esc(d.creator)}</span></span>
        ${typeTag(d)}
      </a></li>`,
        )
        .join("");

    document.getElementById("homePlayers").innerHTML = getPlayerStats()
        .slice(0, 5)
        .map(
            (p) => `<li><a class="row" href="${playerHref(p.name)}">
        <span class="row-rank ${medalClass(p.position)}">${p.position}</span>
        ${flagHTML(p.flag)}
        <span class="row-main"><span class="row-title">${esc(p.name)}</span><span class="row-sub">${p.comps} completion${p.comps !== 1 ? "s" : ""}</span></span>
        <span class="pts">${p.pts.toLocaleString()} pts</span>
      </a></li>`,
        )
        .join("");

    document.getElementById("homeRecent").innerHTML = recentRecords(5).map(recentRecordRow).join("");

    // Members, highest points first
    document.getElementById("homeMembers").innerHTML = CLAN_MEMBERS.map((m) => ({ m, p: getPlayer(m.name) }))
        .sort((a, b) => (b.p?.pts || 0) - (a.p?.pts || 0))
        .map(
            ({ m, p }) => `<li class="row">
        ${flagHTML(p?.flag)}
        <span class="row-main"><a class="row-title text-link" href="${playerHref(m.name)}">${esc(m.name)}</a></span>
        <span class="pts muted">${(p?.pts || 0).toLocaleString()} pts</span>
        <a class="icon-btn" href="${esc(m.youtube)}" target="_blank" rel="noopener" title="${esc(m.name)} on YouTube" aria-label="${esc(m.name)} on YouTube">${icon("youtube")}</a>
      </li>`,
        )
        .join("");
}
