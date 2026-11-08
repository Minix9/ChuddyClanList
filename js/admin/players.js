// ═══════════════════════════════════════════════════════════════════════════════
// PLAYERS
// ═══════════════════════════════════════════════════════════════════════════════
function renderPlayers() {
    const q = document.getElementById("playerSearch").value.trim().toLowerCase();
    const list = players.filter((p) => !q || p.name.toLowerCase().includes(q));

    document.getElementById("playerTableBody").innerHTML = list.length
        ? list
              .map((p) => {
                  const recs = records.filter((r) => r.player_id === p.id);
                  const comps = recs.filter((r) => r.percentage === 100).length;
                  const country = COUNTRIES.find(([c]) => c === flagCode(p.flag));
                  return `<tr>
          <td><span class="cell-player">${flagHTML(p.flag)}<span><span class="cell-title">${esc(p.name)}</span><span class="cell-sub" style="display:block">${country ? esc(country[1]) : "No country"}</span></span></span></td>
          <td class="num muted">${recs.length}</td>
          <td class="num"><span class="pct full">${comps}</span></td>
          <td><div class="action-row">
            <button class="icon-btn sm" onclick="viewPlayerRecords('${p.id}')" title="Show records" aria-label="Show records">${icon("list")}</button>
            <button class="icon-btn sm" onclick="editPlayer('${p.id}')" title="Edit" aria-label="Edit">${icon("pencil")}</button>
            <button class="icon-btn sm danger" onclick="deletePlayer('${p.id}')" title="Delete" aria-label="Delete">${icon("trash")}</button>
          </div></td>
        </tr>`;
              })
              .join("")
        : `<tr><td colspan="4" class="empty-table">${q ? "No players match your search" : "No players yet"}</td></tr>`;
}

// Jump to the Records panel filtered to one player
function viewPlayerRecords(id) {
    document.getElementById("filterDemon").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterPlayer").value = id;
    renderRecords();
    showPanel("records");
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY PICKER
// The database stores flags as emoji ("🇩🇪"). Emoji flags are awkward to type on
// Windows, so the form offers a country list and converts the choice back.
// ═══════════════════════════════════════════════════════════════════════════════
const COUNTRIES = [
    ["ar", "Argentina"], ["au", "Australia"], ["at", "Austria"], ["be", "Belgium"], ["br", "Brazil"],
    ["bg", "Bulgaria"], ["ca", "Canada"], ["cl", "Chile"], ["cn", "China"], ["co", "Colombia"],
    ["hr", "Croatia"], ["cz", "Czechia"], ["dk", "Denmark"], ["gb-eng", "England"], ["ee", "Estonia"],
    ["fi", "Finland"], ["fr", "France"], ["de", "Germany"], ["gr", "Greece"], ["hk", "Hong Kong"],
    ["hu", "Hungary"], ["is", "Iceland"], ["in", "India"], ["id", "Indonesia"], ["ie", "Ireland"],
    ["il", "Israel"], ["it", "Italy"], ["jp", "Japan"], ["kz", "Kazakhstan"], ["lv", "Latvia"],
    ["lt", "Lithuania"], ["lu", "Luxembourg"], ["my", "Malaysia"], ["mx", "Mexico"], ["nl", "Netherlands"],
    ["nz", "New Zealand"], ["no", "Norway"], ["pe", "Peru"], ["ph", "Philippines"], ["pl", "Poland"],
    ["pt", "Portugal"], ["ro", "Romania"], ["ru", "Russia"], ["sa", "Saudi Arabia"], ["gb-sct", "Scotland"],
    ["rs", "Serbia"], ["sg", "Singapore"], ["sk", "Slovakia"], ["si", "Slovenia"], ["za", "South Africa"],
    ["kr", "South Korea"], ["es", "Spain"], ["se", "Sweden"], ["ch", "Switzerland"], ["tw", "Taiwan"],
    ["th", "Thailand"], ["tr", "Türkiye"], ["ua", "Ukraine"], ["ae", "United Arab Emirates"],
    ["gb", "United Kingdom"], ["us", "United States"], ["uy", "Uruguay"], ["ve", "Venezuela"],
    ["vn", "Vietnam"], ["gb-wls", "Wales"],
];
const NO_FLAG = "🌐";

// "de" → 🇩🇪,  "gb-eng" → 🏴 England tag sequence
function codeToFlagEmoji(code) {
    if (!code) return NO_FLAG;
    if (code.includes("-")) {
        const tags = code.replace("-", "");
        return String.fromCodePoint(0x1f3f4, ...[...tags].map((c) => 0xe0000 + c.charCodeAt(0)), 0xe007f);
    }
    return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 97));
}

function fillCountrySelect(currentFlag) {
    const current = flagCode(currentFlag);
    const options = [["", "No country"], ...COUNTRIES];
    // Keep a country that isn't in the list selectable instead of silently dropping it
    if (current && !COUNTRIES.some(([c]) => c === current)) options.push([current, `${current.toUpperCase()} (current)`]);
    const sel = document.getElementById("playerCountry");
    sel.innerHTML = options.map(([c, name]) => `<option value="${c}">${esc(name)}</option>`).join("");
    sel.value = current || "";
    previewCountry();
}

function previewCountry() {
    const code = document.getElementById("playerCountry").value;
    document.getElementById("playerCountryFlag").innerHTML = flagHTML(codeToFlagEmoji(code));
}

function openPlayerModal() {
    document.getElementById("playerId").value = "";
    document.getElementById("playerName").value = "";
    fillCountrySelect("");
    document.getElementById("playerModalTitle").textContent = "Add player";
    openModal("playerModal");
}

function editPlayer(id) {
    const p = players.find((x) => x.id === id);
    if (!p) return;
    document.getElementById("playerId").value = p.id;
    document.getElementById("playerName").value = p.name;
    fillCountrySelect(p.flag);
    document.getElementById("playerModalTitle").textContent = "Edit player";
    openModal("playerModal");
}

async function savePlayer() {
    const id = document.getElementById("playerId").value;
    const payload = {
        name: document.getElementById("playerName").value.trim(),
        flag: codeToFlagEmoji(document.getElementById("playerCountry").value),
    };
    if (!payload.name) {
        toast("Enter a player name", "error");
        return;
    }
    const clash = players.find((p) => p.name.toLowerCase() === payload.name.toLowerCase() && p.id !== id);
    if (clash) {
        toast(`A player called "${clash.name}" already exists`, "error");
        return;
    }
    const ok = await runTask(
        () => (id ? sbPatch("players", id, payload) : sbInsert("players", payload)),
        id ? "Player updated" : "Player added",
    );
    if (ok) closeModal("playerModal");
}

async function deletePlayer(id) {
    const p = players.find((x) => x.id === id);
    if (!p) return;
    const recCount = records.filter((r) => r.player_id === id).length;
    const ok = await confirmDialog(
        `Delete "${p.name}"?`,
        `This also removes their ${recCount} record${recCount !== 1 ? "s" : ""}. This can't be undone.`,
    );
    if (!ok) return;
    await runTask(async () => {
        await sbDelete("records", `player_id=eq.${id}`);
        await sbDelete("players", `id=eq.${id}`);
    }, "Player deleted");
}
