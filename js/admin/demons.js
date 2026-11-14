// ═══════════════════════════════════════════════════════════════════════════════
// DEMONS
// ═══════════════════════════════════════════════════════════════════════════════
function renderDemons() {
    const q = document.getElementById("demonSearch").value.trim().toLowerCase();
    const list = demons.filter((d) => !q || d.name.toLowerCase().includes(q) || d.creator.toLowerCase().includes(q));
    const last = demons.length;

    document.getElementById("demonTableBody").innerHTML = list.length
        ? list
              .map((d) => {
                  const recCount = records.filter((r) => r.demon_id === d.id).length;
                  const thumb = d.video_id
                      ? `<img class="cell-thumb" src="${youtubeThumb(d.video_id, "mqdefault")}" alt="" loading="lazy" />`
                      : `<span class="cell-thumb">${icon("video")}</span>`;
                  const video = d.video_id
                      ? `<a class="code video-link" href="https://youtu.be/${encodeURIComponent(d.video_id)}" target="_blank" rel="noopener">${icon("play")}${esc(d.video_id)}</a>`
                      : `<span class="muted small">${icon("alert")} None</span>`;
                  return `
        <tr>
          <td><span class="rank-badge ${rankClass(d.rank)}">${d.rank}</span></td>
          <td><div class="cell-level">${thumb}<div><div class="cell-title">${esc(d.name)}</div><div class="cell-sub">by ${esc(d.creator)} · ${d.is_challenge ? "Challenge" : "Demon"}${d.level_id ? ` · ID ${d.level_id}` : ""}</div></div></div></td>
          <td>${video}</td>
          <td class="num muted">${recCount}</td>
          <td><div class="action-row">
            <button class="icon-btn sm" onclick="nudgeDemon('${d.id}', -1)" title="Move up" aria-label="Move up" ${d.rank <= 1 ? "disabled" : ""}>${icon("arrow-up")}</button>
            <button class="icon-btn sm" onclick="nudgeDemon('${d.id}', 1)" title="Move down" aria-label="Move down" ${d.rank >= last ? "disabled" : ""}>${icon("arrow-down")}</button>
            <span class="action-sep"></span>
            <button class="icon-btn sm" onclick="editDemon('${d.id}')" title="Edit" aria-label="Edit">${icon("pencil")}</button>
            <button class="icon-btn sm danger" onclick="deleteDemon('${d.id}')" title="Delete" aria-label="Delete">${icon("trash")}</button>
          </div></td>
        </tr>`;
              })
              .join("")
        : `<tr><td colspan="5" class="empty-table">${q ? "No demons match your search" : "No demons yet — add one!"}</td></tr>`;
}

function setRankHint(isNew) {
    const max = demons.length + (isNew ? 1 : 0);
    document.getElementById("demonRank").max = max;
    document.getElementById("demonRankHint").textContent = `1 – ${max}. Other levels shift automatically.`;
}

function openDemonModal() {
    document.getElementById("demonId").value = "";
    document.getElementById("demonName").value = "";
    document.getElementById("demonCreator").value = "";
    document.getElementById("demonRank").value = demons.length + 1;
    document.getElementById("demonVideo").value = "";
    document.getElementById("demonVideoPreview").textContent = "";
    document.getElementById("demonType").value = "demon";
    document.getElementById("demonLevelId").value = "";
    document.getElementById("demonModalTitle").textContent = "Add demon";
    setRankHint(true);
    openModal("demonModal");
}

function editDemon(id) {
    const d = demons.find((x) => x.id === id);
    if (!d) return;
    document.getElementById("demonId").value = d.id;
    document.getElementById("demonName").value = d.name;
    document.getElementById("demonCreator").value = d.creator;
    document.getElementById("demonRank").value = d.rank;
    document.getElementById("demonVideo").value = d.video_id;
    document.getElementById("demonVideoPreview").textContent = "";
    document.getElementById("demonType").value = d.is_challenge ? "challenge" : "demon";
    document.getElementById("demonLevelId").value = d.level_id ?? "";
    document.getElementById("demonModalTitle").textContent = "Edit demon";
    setRankHint(false);
    openModal("demonModal");
}

async function saveDemon() {
    const id = document.getElementById("demonId").value;
    const payload = {
        name: document.getElementById("demonName").value.trim(),
        creator: document.getElementById("demonCreator").value.trim(),
        video_id: extractYouTubeId(document.getElementById("demonVideo").value),
        is_challenge: document.getElementById("demonType").value === "challenge",
        level_id: parseInt(document.getElementById("demonLevelId").value) || null,
    };
    const rank = parseInt(document.getElementById("demonRank").value);
    if (rank < 1) {
        toast("Rank 1 is the top of the list — nothing can go above it", "error");
        return;
    }
    // The video is optional — levels without one are stored with an empty video_id
    if (!payload.name || !payload.creator || !rank) {
        toast("Fill in name, creator and rank", "error");
        return;
    }

    const ok = await runTask(
        async () => {
            if (id) {
                await sbPatch("demons", id, payload);
                const original = demons.find((d) => d.id === id);
                if (original && original.rank !== rank) await moveDemon(original, rank);
            } else {
                const target = Math.min(Math.max(rank, 1), demons.length + 1);
                await shiftRanks(target, Infinity, +1); // make room
                await sbInsert("demons", { ...payload, rank: target });
            }
        },
        id ? "Demon updated" : "Demon added",
    );
    if (ok) closeModal("demonModal");
}

async function deleteDemon(id) {
    const d = demons.find((x) => x.id === id);
    if (!d) return;
    const recCount = records.filter((r) => r.demon_id === id).length;
    const ok = await confirmDialog(
        `Delete "${d.name}"?`,
        `This also removes its ${recCount} record${recCount !== 1 ? "s" : ""}, and every level below #${d.rank} moves up one spot. This can't be undone.`,
    );
    if (!ok) return;
    await runTask(async () => {
        await sbDelete("records", `demon_id=eq.${id}`);
        await sbDelete("demons", `id=eq.${id}`);
        await shiftRanks(d.rank + 1, Infinity, -1); // close the gap
    }, "Demon deleted — list re-ranked");
}

function nudgeDemon(id, delta) {
    const d = demons.find((x) => x.id === id);
    if (!d) return;
    runTask(() => moveDemon(d, d.rank + delta), null);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RANK SHIFTING
// `rank` is UNIQUE in the database and checked row by row, so every shift is
// done one row at a time in an order that never makes two rows collide.
// ═══════════════════════════════════════════════════════════════════════════════
// Temporary slot while a demon is being moved. Positive and far past the end of
// the list, so it also passes the database rule "rank >= 1" (supabase_rank_check.sql).
const PARK_RANK = 1000000;

// Shifts every demon with from <= rank <= to by `delta` (+1 or -1)
async function shiftRanks(from, to, delta) {
    const toShift = demons
        .filter((d) => d.rank >= from && d.rank <= to)
        .sort((a, b) => (delta > 0 ? b.rank - a.rank : a.rank - b.rank));
    for (const d of toShift) {
        await sbPatch("demons", d.id, { rank: d.rank + delta });
    }
}

// Moves one demon to a new position and slides the ones in between,
// e.g. moving #3 → #7 pulls #4–#7 up one, leaving no gaps or duplicates.
async function moveDemon(demon, newRank) {
    const oldRank = demon.rank;
    newRank = Math.min(Math.max(newRank, 1), demons.length);
    if (newRank === oldRank) return;

    await sbPatch("demons", demon.id, { rank: PARK_RANK });
    const others = demons.filter((d) => d.id !== demon.id);
    const saved = demons;
    demons = others; // so shiftRanks ignores the parked demon
    try {
        if (newRank < oldRank) await shiftRanks(newRank, oldRank - 1, +1);
        else await shiftRanks(oldRank + 1, newRank, -1);
    } finally {
        demons = saved;
    }
    await sbPatch("demons", demon.id, { rank: newRank });
}
