// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR — level list, search, keyboard browsing
// ═══════════════════════════════════════════════════════════════════════════════
function renderSidebar(list) {
    const ul = document.getElementById("demonList");
    document.getElementById("sidebarCount").textContent =
        list.length === DEMONS.length ? `${DEMONS.length} levels` : `${list.length} of ${DEMONS.length} levels`;

    if (!list.length) {
        ul.innerHTML = `<li class="sidebar-empty">No levels match your search</li>`;
        return;
    }

    ul.innerHTML = list
        .map((d) => {
            const thumb = d.video
                ? `<img class="d-thumb" src="${youtubeThumb(d.video, "mqdefault")}" alt="" loading="lazy" />`
                : `<span class="d-thumb"></span>`;
            return `
    <li>
      <a class="demon-item ${currentRank === d.rank ? "active" : ""}" href="#/demon/${d.rank}" data-rank="${d.rank}">
        <span class="d-rank ${rankClass(d.rank)}">${d.rank}</span>
        ${thumb}
        <span class="d-text">
          <span class="d-name">${esc(d.name)}</span>
          <span class="d-sub">
            <span class="d-creator">${esc(d.creator)}</span>
            <span class="d-completions" title="Completions">${icon("check")}${completionCount(d)}</span>
          </span>
        </span>
      </a>
    </li>`;
        })
        .join("");
}

function filterList(q) {
    const v = q.trim().toLowerCase();
    filtered = v
        ? DEMONS.filter(
              (d) => d.name.toLowerCase().includes(v) || d.creator.toLowerCase().includes(v) || String(d.rank) === v.replace("#", ""),
          )
        : [...DEMONS];
    renderSidebar(filtered);
}

function setSidebarActive(rank) {
    document.querySelectorAll(".demon-item").forEach((el) => {
        const on = Number(el.dataset.rank) === rank;
        el.classList.toggle("active", on);
        if (on) el.scrollIntoView({ block: "nearest" });
    });
}

// Step through the (filtered) list with the arrow keys
function moveSelection(delta) {
    if (!filtered.length) return;
    const idx = filtered.findIndex((d) => d.rank === currentRank);
    const next = idx === -1 ? 0 : Math.min(Math.max(idx + delta, 0), filtered.length - 1);
    if (filtered[next].rank !== currentRank) goToDemon(filtered[next].rank, true);
}
