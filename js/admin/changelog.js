// ═══════════════════════════════════════════════════════════════════════════════
// CHANGELOG — list of entries + an editor with a toolbar, level search and live
// preview. Entries are written in changelog markup (js/shared/changelog-markup.js).
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_TAGS = ["Placements", "New levels", "Removals", "Records", "Site update"];
const BODY_EXAMPLE = `Short intro of what changed.

## Summary
- **Bold** for the important bit

## Biggest climbs
+12 [[Level name]] #5`;

let clSnapshot = ""; // form contents when the editor opened, to warn before throwing changes away
// While the search is open: { mode, sel: [from, to] where to insert, first: 1st level of a swap }
let clPick = null;

const clEl = (id) => document.getElementById(id);
const clFormState = () => ["clTitle", "clDate", "clTag", "clBody"].map((id) => clEl(id).value).join("\u0000");
// Does a [[link]] point at something real? (players for [[@name]], levels otherwise)
const clExists = (name, type) => (type === "player" ? players : demons).some((x) => x.name.toLowerCase() === name.toLowerCase());

function renderChangelogTable() {
    const body = clEl("changelogTableBody");
    if (changelog === null) {
        body.innerHTML = `<tr><td colspan="4" class="empty-table">${icon("alert")} Run supabase_changelog.sql in Supabase first</td></tr>`;
        return;
    }
    body.innerHTML = changelog.length
        ? changelog
              .map(
                  (e) => `<tr>
        <td class="muted">${esc(changelogDate(e.published_on))}</td>
        <td><div class="cell-title">${esc(e.title)}</div></td>
        <td>${e.tag ? `<span class="badge badge-accent">${esc(e.tag)}</span>` : ""}</td>
        <td><div class="action-row">
          <button class="icon-btn sm" onclick="openChangelogEditor('${e.id}')" title="Edit" aria-label="Edit">${icon("pencil")}</button>
          <button class="icon-btn sm danger" onclick="deleteChangelog('${e.id}')" title="Delete" aria-label="Delete">${icon("trash")}</button>
        </div></td>
      </tr>`,
              )
              .join("")
        : `<tr><td colspan="4" class="empty-table">No entries yet — write the first one!</td></tr>`;

    const tags = [...new Set([...changelog.map((e) => e.tag).filter(Boolean), ...DEFAULT_TAGS])];
    clEl("clTagOptions").innerHTML = tags.map((t) => `<option value="${esc(t)}"></option>`).join("");
}

// ── OPEN / CLOSE ─────────────────────────────────────────────────────────────
function openChangelogEditor(id) {
    if (changelog === null) {
        toast("Run supabase_changelog.sql in Supabase first", "error");
        return;
    }
    const e = changelog.find((x) => x.id === id);
    clEl("clId").value = e?.id || "";
    clEl("clTitle").value = e?.title || "";
    clEl("clDate").value = e?.published_on || toDateInput();
    clEl("clTag").value = e?.tag || "";
    clEl("clBody").value = e?.body || "";
    clEl("clBody").placeholder = BODY_EXAMPLE;
    clEl("clEditorTitle").textContent = e ? "Edit entry" : "New entry";
    closePicker();
    clSnapshot = clFormState();
    clEl("clListView").hidden = true;
    clEl("clEditorView").hidden = false;
    updateChangelogPreview();
    clEl("clTitle").focus();
}

async function closeChangelogEditor(force = false) {
    if (!force && clFormState() !== clSnapshot) {
        const ok = await confirmDialog("Discard changes?", "This entry has unsaved changes. They will be lost.", "Discard");
        if (!ok) return;
    }
    clEl("clEditorView").hidden = true;
    clEl("clListView").hidden = false;
}

// ── PREVIEW ──────────────────────────────────────────────────────────────────
function updateChangelogPreview() {
    const entry = {
        title: clEl("clTitle").value.trim() || "Untitled",
        tag: clEl("clTag").value.trim(),
        body: clEl("clBody").value,
        published_on: clEl("clDate").value || toDateInput(),
    };
    clEl("clPreview").innerHTML = changelogEntryHTML(entry, clExists);
    // Names inside [[ ]] that match no level / player would link to nothing
    const missing = [
        ...new Set(
            [...entry.body.matchAll(/\[\[(@?)(.+?)\]\]/g)]
                .filter((m) => !clExists(m[2].trim(), m[1] ? "player" : "level"))
                .map((m) => m[1] + m[2]),
        ),
    ];
    clEl("clWarnings").innerHTML = missing.length
        ? `<span class="warn">${icon("alert")} Not found: ${missing.map(esc).join(", ")} — use the Level / Player buttons to pick the exact name</span>`
        : "";
}

// ── SAVE / DELETE ────────────────────────────────────────────────────────────
async function saveChangelog() {
    const id = clEl("clId").value;
    const payload = {
        title: clEl("clTitle").value.trim(),
        tag: clEl("clTag").value.trim(),
        body: clEl("clBody").value.trim(),
        published_on: clEl("clDate").value,
    };
    if (!payload.title || !payload.body || !payload.published_on) {
        toast("Fill in a title, a date and some text", "error");
        return;
    }
    const ok = await runTask(
        () => (id ? sbPatch("changelog", id, payload) : sbInsert("changelog", payload)),
        id ? "Entry updated" : "Entry published",
    );
    if (ok) closeChangelogEditor(true);
}

async function deleteChangelog(id) {
    const e = changelog.find((x) => x.id === id);
    if (!e) return;
    const ok = await confirmDialog(`Delete "${e.title}"?`, "It disappears from the site's Changelog tab. This can't be undone.");
    if (ok) runTask(() => sbDelete("changelog", `id=eq.${id}`), "Entry deleted");
}

// ── TEXT EDITING ─────────────────────────────────────────────────────────────
// Replaces [from, to) in the text box with text, then selects text[selStart, selEnd)
function clReplace(from, to, text, selStart = text.length, selEnd = selStart) {
    const ta = clEl("clBody");
    ta.focus();
    ta.setRangeText(text, from, to, "end");
    ta.setSelectionRange(from + selStart, from + selEnd);
    updateChangelogPreview();
}

function clBold() {
    const ta = clEl("clBody");
    const { selectionStart: a, selectionEnd: b } = ta;
    const inner = ta.value.slice(a, b) || "bold text";
    clReplace(a, b, `**${inner}**`, 2, 2 + inner.length);
}

// Puts prefix ("## " or "- ") in front of every selected line (or an example on an empty line)
function clLinePrefix(prefix) {
    const ta = clEl("clBody");
    const start = ta.value.lastIndexOf("\n", ta.selectionStart - 1) + 1;
    const nl = ta.value.indexOf("\n", ta.selectionEnd);
    const end = nl === -1 ? ta.value.length : nl;
    const lines = ta.value.slice(start, end).split("\n");
    if (lines.length === 1 && !lines[0].trim()) {
        const example = prefix === "## " ? "Label" : "Point";
        return clReplace(start, end, prefix + example, prefix.length, prefix.length + example.length);
    }
    const out = lines.map((l) => (l.startsWith(prefix) || !l.trim() ? l : prefix + l)).join("\n");
    clReplace(start, end, out, 0, out.length);
}

// ── LEVEL / PLAYER SEARCH ────────────────────────────────────────────────────
// What each toolbar button does with the level (or player) you pick
const PICK_HINTS = {
    link: "Insert link",
    player: "Insert player link",
    up: "Add climb row",
    down: "Add drop row",
    new: "Add as new level",
    swap: "Swap: pick the first level",
    first: "Announce first victor",
};

function openPicker(mode) {
    const ta = clEl("clBody");
    clPick = { mode, sel: [ta.selectionStart, ta.selectionEnd], first: null };
    clEl("clPicker").hidden = false;
    clEl("clPickerSearch").value = "";
    clEl("clPickerSearch").placeholder = mode === "player" ? "Search a player…" : "Search a level…";
    renderPicker();
    clEl("clPickerSearch").focus();
}

function closePicker() {
    clPick = null;
    clEl("clPicker").hidden = true;
}

function pickerMatches() {
    const q = clEl("clPickerSearch").value.trim().toLowerCase();
    const list = clPick.mode === "player" ? players : demons.filter((d) => d.id !== clPick.first?.id);
    return list.filter((x) => !q || x.name.toLowerCase().includes(q) || String(x.rank) === q.replace("#", "")).slice(0, 8);
}

function renderPicker() {
    const hint = clPick.first ? `Swap with #${clPick.first.rank} ${esc(clPick.first.name)}` : PICK_HINTS[clPick.mode];
    clEl("clPickerList").innerHTML =
        pickerMatches()
            .map(
                (x) =>
                    `<button type="button" class="cl-picker-item" onclick="pickItem('${x.id}')">${x.rank ? `<span class="muted">#${x.rank}</span> ` : ""}${esc(x.name)}<span class="muted cl-picker-hint">${hint}</span></button>`,
            )
            .join("") || `<div class="cl-picker-empty muted">Nothing matches</div>`;
}

function pickerKey(e) {
    if (e.key === "Escape") {
        e.preventDefault();
        closePicker();
        clEl("clBody").focus();
    } else if (e.key === "Enter") {
        e.preventDefault(); // don't submit the form
        const first = pickerMatches()[0];
        if (first) pickItem(first.id);
    }
}

function pickItem(id) {
    const { mode, sel, first } = clPick;
    const item = (mode === "player" ? players : demons).find((x) => x.id === id);
    if (!item) return closePicker();
    if (mode === "swap" && !first) {
        // A swap needs two levels: keep the search open for the second one
        clPick.first = item;
        clEl("clPickerSearch").value = "";
        renderPicker();
        return clEl("clPickerSearch").focus();
    }
    closePicker();
    const [a, b] = sel;
    if (mode === "link") return clReplace(a, b, `[[${item.name}]]`);
    if (mode === "player") return clReplace(a, b, `[[@${item.name}]]`);
    if (mode === "first") return insertFirstVictor(item, a, b);

    // Rows go on their own line
    const text = clEl("clBody").value;
    const lead = a > 0 && text[a - 1] !== "\n" ? "\n" : "";
    if (mode === "new") return clReplace(a, b, `${lead}new [[${item.name}]] #${item.rank}`);
    if (mode === "swap") {
        // Done after the swap on the list: the level now higher climbed, the other dropped
        const [hi, lo] = [first, item].sort((x, y) => x.rank - y.rank);
        const by = lo.rank - hi.rank;
        return clReplace(a, b, `${lead}+${by} [[${hi.name}]] #${hi.rank}\n-${by} [[${lo.name}]] #${lo.rank}`);
    }
    // Climb / drop: the "1" is selected so you just type how far it moved
    clReplace(a, b, `${lead}${mode === "up" ? "+" : "-"}1 [[${item.name}]] #${item.rank}`, lead.length + 1, lead.length + 2);
}

// "Player is the first victor of Level" — the player comes from the records
function insertFirstVictor(level, a, b) {
    const firstIds = getFirstVictorIds();
    const fv = records.find((r) => r.demon_id === level.id && firstIds.has(r.id));
    if (!fv) {
        const verifier = records.find((r) => r.demon_id === level.id && r.is_verifier);
        toast(
            verifier
                ? `${level.name} has a verifier (${verifier.players?.name}), so it has no first victor`
                : `No 100% record on ${level.name} yet — add the record first`,
            "error",
        );
        return;
    }
    clReplace(a, b, `**[[@${fv.players.name}]]** is the first victor of [[${level.name}]] #${level.rank}!`);
}

// Ctrl+B bold, Ctrl+K level link
function changelogShortcut(e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b") {
        e.preventDefault();
        clBold();
    } else if (k === "k") {
        e.preventDefault();
        openPicker("link");
    }
}
