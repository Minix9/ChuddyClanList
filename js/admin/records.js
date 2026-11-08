// ═══════════════════════════════════════════════════════════════════════════════
// RECORDS
// ═══════════════════════════════════════════════════════════════════════════════
let recordSort = { col: "rank", dir: 1 }; // default: by list spot ascending

function sortRecords(col) {
    if (recordSort.col === col) recordSort.dir *= -1;
    else recordSort = { col, dir: col === "date" || col === "pct" ? -1 : 1 };
    renderRecords();
}

function recordSortValue(r, col) {
    switch (col) {
        case "player":
            return (r.players?.name || "").toLowerCase();
        case "rank":
            return r.demons?.rank || 0;
        case "pct":
            return r.percentage;
        case "attempts":
            return r.attempts || 0;
        case "date":
            return r.created_at || "";
        default:
            return 0;
    }
}

function renderRecords() {
    const dFilter = document.getElementById("filterDemon").value;
    const pFilter = document.getElementById("filterPlayer").value;
    const sFilter = document.getElementById("filterStatus").value;

    const list = records
        .filter(
            (r) =>
                (!dFilter || r.demon_id === dFilter) &&
                (!pFilter || r.player_id === pFilter) &&
                (!sFilter || (sFilter === "full" ? r.percentage === 100 : r.percentage < 100)),
        )
        .sort((a, b) => {
            const va = recordSortValue(a, recordSort.col);
            const vb = recordSortValue(b, recordSort.col);
            return va < vb ? -recordSort.dir : va > vb ? recordSort.dir : 0;
        });

    const firstVictorIds = getFirstVictorIds();

    document.getElementById("recordTableBody").innerHTML = list.length
        ? list
              .map(
                  (r) => `
        <tr>
          <td><span class="cell-player">${flagHTML(r.players?.flag)}${esc(r.players?.name || "?")}</span></td>
          <td><span class="rank-badge ${rankClass(r.demons?.rank)}">${r.demons?.rank}</span> ${esc(r.demons?.name || "?")}</td>
          <td>
            <span class="pct ${r.percentage === 100 ? "full" : ""}">${r.percentage}%</span>
            ${firstVictorIds.has(r.id) ? `<span class="badge badge-first" title="First to beat this level">${icon("crown")}First</span>` : ""}
          </td>
          <td class="num muted">${r.attempts ? r.attempts.toLocaleString() : "—"}</td>
          <td class="muted">${formatShortDate(r.created_at) || "—"}</td>
          <td><div class="action-row">
            ${
                r.video_id
                    ? `<a class="icon-btn sm" href="https://youtu.be/${encodeURIComponent(r.video_id)}" target="_blank" rel="noopener" title="Open completion video" aria-label="Open completion video">${icon("video")}</a>`
                    : ""
            }
            <button class="icon-btn sm" onclick="editRecord('${r.id}')" title="Edit" aria-label="Edit">${icon("pencil")}</button>
            <button class="icon-btn sm danger" onclick="deleteRecord('${r.id}')" title="Delete" aria-label="Delete">${icon("trash")}</button>
          </div></td>
        </tr>`,
              )
              .join("")
        : `<tr><td colspan="6" class="empty-table">No records found</td></tr>`;

    // Header sort arrows
    ["player", "rank", "pct", "attempts", "date"].forEach((col) => {
        document.getElementById(`sort-${col}`).innerHTML =
            recordSort.col === col ? icon(recordSort.dir === 1 ? "arrow-up" : "arrow-down") : "";
    });
}

function findRecord(demonId, playerId) {
    return records.find((r) => r.demon_id === demonId && r.player_id === playerId);
}

// In "Add" mode, warn when the picked player already has a record on that demon
// (only one row per pair is allowed, so saving will update it instead)
function checkExistingRecord() {
    const hint = document.getElementById("recordExistingHint");
    const editingId = document.getElementById("recordId").value;
    const existing = findRecord(document.getElementById("recordDemon").value, document.getElementById("recordPlayer").value);
    hint.innerHTML =
        existing && existing.id !== editingId
            ? `<span class="warn">${icon("alert")} This player already has ${existing.percentage}% on this level — saving will update it.</span>`
            : "";
}

// ISO timestamp → "YYYY-MM-DD" in local time, for <input type="date">
function toDateInput(iso) {
    const d = iso ? new Date(iso) : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fillRecordForm(r) {
    document.getElementById("recordId").value = r?.id || "";
    const dateInput = document.getElementById("recordDate");
    dateInput.value = toDateInput(r?.created_at);
    dateInput.max = toDateInput();
    dateInput.dataset.original = r ? toDateInput(r.created_at) : "";
    if (r) {
        document.getElementById("recordDemon").value = r.demon_id;
        document.getElementById("recordPlayer").value = r.player_id;
    } else {
        // Pre-fill from the active filters — handy when adding several records in a row
        const fd = document.getElementById("filterDemon").value;
        const fp = document.getElementById("filterPlayer").value;
        if (fd) document.getElementById("recordDemon").value = fd;
        else document.getElementById("recordDemon").selectedIndex = 0;
        if (fp) document.getElementById("recordPlayer").value = fp;
        else document.getElementById("recordPlayer").selectedIndex = 0;
    }
    document.getElementById("recordPct").value = r ? r.percentage : 100;
    document.getElementById("recordAttempts").value = r?.attempts || "";
    document.getElementById("recordVideo").value = r?.video_id || "";
    document.getElementById("recordVideoPreview").textContent = "";
    document.getElementById("recordModalTitle").textContent = r ? "Edit record" : "Add record";
    checkExistingRecord();
}

function openRecordModal() {
    if (!demons.length || !players.length) {
        toast("Add at least one demon and one player first", "error");
        return;
    }
    fillRecordForm(null);
    openModal("recordModal");
}

function editRecord(id) {
    const r = records.find((x) => x.id === id);
    if (!r) return;
    fillRecordForm(r);
    openModal("recordModal");
}

async function saveRecord() {
    const id = document.getElementById("recordId").value;
    const attemptsRaw = document.getElementById("recordAttempts").value.trim();
    const videoRaw = document.getElementById("recordVideo").value.trim();
    const payload = {
        demon_id: document.getElementById("recordDemon").value,
        player_id: document.getElementById("recordPlayer").value,
        percentage: parseInt(document.getElementById("recordPct").value),
        attempts: attemptsRaw ? parseInt(attemptsRaw) : null,
        video_id: videoRaw ? extractYouTubeId(videoRaw) : null,
    };
    if (!payload.demon_id || !payload.player_id || isNaN(payload.percentage)) {
        toast("Fill in all fields", "error");
        return;
    }
    if (payload.percentage < 1 || payload.percentage > 100) {
        toast("Percentage must be between 1 and 100", "error");
        return;
    }

    // Completion date (created_at). Only sent when it changed, so an untouched
    // date keeps its exact original time. Midday UTC = same day in every time zone.
    const dateInput = document.getElementById("recordDate");
    const day = dateInput.value;
    if (!day) {
        toast("Pick a completion date", "error");
        return;
    }
    if (day > toDateInput()) {
        toast("The completion date can't be in the future", "error");
        return;
    }
    if (day !== dateInput.dataset.original) payload.created_at = `${day}T12:00:00Z`;

    // Only one row per player + demon pair is allowed (records_demon_id_player_id_key),
    // so adding a duplicate pair updates the existing row instead.
    const existing = findRecord(payload.demon_id, payload.player_id);
    const targetId = id || existing?.id;
    if (id && existing && existing.id !== id) {
        toast("That player already has a record on this level — edit that one instead", "error");
        return;
    }

    const ok = await runTask(
        () => (targetId ? sbPatch("records", targetId, payload) : sbInsert("records", payload)),
        id ? "Record updated" : existing ? "Existing record updated" : "Record added",
    );
    if (ok) closeModal("recordModal");
}

async function deleteRecord(id) {
    const r = records.find((x) => x.id === id);
    const what = r ? `${r.players?.name || "?"}'s ${r.percentage}% on ${r.demons?.name || "?"}` : "this record";
    if (!(await confirmDialog("Delete this record?", `This removes ${what}. This can't be undone.`))) return;
    await runTask(() => sbDelete("records", `id=eq.${id}`), "Record deleted");
}
