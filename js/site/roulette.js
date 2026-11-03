// ═══════════════════════════════════════════════════════════════════════════════
// ROULETTE — random level picker with optional no-repeat challenge mode.
// Saved results live in localStorage only (per browser).
// ═══════════════════════════════════════════════════════════════════════════════
let spinning = false;
let rouletteState = {
    currentDemon: null,
    pool: null, // null = challenge not started; array = remaining pool
    saved: loadRouletteSaved(),
};

function loadRouletteSaved() {
    try {
        const list = JSON.parse(localStorage.getItem("rouletteList") || "[]");
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function persistRouletteSaved() {
    try {
        localStorage.setItem("rouletteList", JSON.stringify(rouletteState.saved));
    } catch {}
}

function isChallengeMode() {
    return document.getElementById("challengeMode").checked;
}

function updateChallengeMode() {
    document.getElementById("challengeProgressWrap").hidden = !isChallengeMode();
    rouletteState.pool = null; // reset pool when toggling
    refreshRoulette();
}

function getChallengePool() {
    const savedRanks = new Set(rouletteState.saved.filter((s) => s.pct === 100).map((s) => s.rank));
    return DEMONS.filter((d) => !savedRanks.has(d.rank));
}

function showRouletteDemon(d) {
    document.getElementById("rNum").textContent = `#${d.rank}`;
    document.getElementById("rName").textContent = d.name;
    document.getElementById("rBy").textContent = `by ${d.creator}`;
}

// Thumbnail behind the card once a level has been picked (hidden while spinning)
function setRouletteBg(d) {
    const bg = document.getElementById("rBg");
    if (d?.video) bg.style.backgroundImage = `url("${youtubeThumb(d.video)}")`;
    bg.classList.toggle("show", !!d?.video);
}

function spinRoulette() {
    if (spinning || !DEMONS.length) return;
    document.getElementById("rouletteSaveRow").hidden = true;

    const inChallenge = isChallengeMode();
    if (inChallenge) {
        if (!rouletteState.pool || rouletteState.pool.length === 0) rouletteState.pool = getChallengePool();
        if (rouletteState.pool.length === 0) {
            setRouletteBg(null);
            document.getElementById("rNum").innerHTML = icon("sparkles");
            document.getElementById("rName").textContent = "All done!";
            document.getElementById("rBy").textContent = "You've completed every level.";
            document.getElementById("rPts").textContent = "";
            return;
        }
    }

    spinning = true;
    const spinBtn = document.getElementById("spinBtn");
    spinBtn.disabled = true;

    const pool = inChallenge ? rouletteState.pool : DEMONS;
    const rPts = document.getElementById("rPts");
    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    let t = 0;
    const max = 22;

    setRouletteBg(null);
    const iv = setInterval(() => {
        showRouletteDemon(pick());
        rPts.textContent = "";
        if (++t < max) return;

        clearInterval(iv);
        const final = pick();
        showRouletteDemon(final);
        setRouletteBg(final);
        rPts.innerHTML = `${icon("star")}${calcScore(final.rank, 100)} pts for a completion`;
        rouletteState.currentDemon = final;
        // Remove from pool so the same level isn't shown again this session
        if (inChallenge) rouletteState.pool = rouletteState.pool.filter((d) => d.rank !== final.rank);

        const card = document.getElementById("rouletteCard");
        card.classList.remove("pop");
        void card.offsetWidth;
        card.classList.add("pop");

        document.getElementById("rouletteSaveRow").hidden = false;
        document.getElementById("roulettePct").value = 100;
        updateRemainingInfo();
        spinning = false;
        spinBtn.disabled = false;
    }, 55);
}

function saveRouletteResult() {
    const d = rouletteState.currentDemon;
    if (!d) return;
    const pct = parseInt(document.getElementById("roulettePct").value);
    if (isNaN(pct) || pct < 1 || pct > 100) {
        alert("Enter a valid percentage (1–100)");
        return;
    }
    // Replace any existing entry for this demon, or add new
    rouletteState.saved = rouletteState.saved.filter((s) => s.rank !== d.rank);
    rouletteState.saved.unshift({
        rank: d.rank,
        name: d.name,
        creator: d.creator,
        pct,
        savedAt: new Date().toISOString(),
    });
    persistRouletteSaved();
    document.getElementById("rouletteSaveRow").hidden = true;
    rouletteState.currentDemon = null;
    refreshRoulette();
}

function skipRouletteSpin() {
    document.getElementById("rouletteSaveRow").hidden = true;
    rouletteState.currentDemon = null;
}

function viewRouletteLevel() {
    const d = rouletteState.currentDemon;
    if (d) goToDemon(d.rank);
}

function updateRemainingInfo() {
    const el = document.getElementById("remainingInfo");
    if (!isChallengeMode()) {
        el.textContent = "";
        return;
    }
    const rem = getChallengePool().length;
    const total = DEMONS.length;
    el.textContent = `${rem} of ${total} level${total !== 1 ? "s" : ""} remaining`;
}

function refreshChallengeProgress() {
    const total = DEMONS.length;
    const done = rouletteState.saved.filter((s) => s.pct === 100).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById("challengeProgressText").textContent = `${done} / ${total} completed`;
    document.getElementById("challengeProgressBar").style.width = `${pct}%`;
}

function refreshChallengeList() {
    const saved = rouletteState.saved;
    document.getElementById("challengeListWrap").hidden = !saved.length;
    document.getElementById("challengeList").innerHTML = saved
        .map((s) => {
            const pts = calcScore(s.rank, s.pct);
            return `<div class="mini-row">
          <span class="mini-row-left">
            <span class="rank-num">#${s.rank}</span>
            <span style="min-width:0">
              <span class="mini-row-name" style="display:block">${esc(s.name)}</span>
              <span class="mini-row-sub" style="display:block">${pts} pts · by ${esc(s.creator)}</span>
            </span>
          </span>
          <span class="saved-row-right">
            <span class="meta">${icon("calendar")}${formatShortDate(s.savedAt)}</span>
            <span class="pct ${s.pct === 100 ? "full" : ""}">${s.pct}%</span>
            <button class="saved-remove" onclick="removeRouletteSaved(${Number(s.rank)})" title="Remove" aria-label="Remove">${icon("x")}</button>
          </span>
        </div>`;
        })
        .join("");
}

function refreshRoulette() {
    refreshChallengeList();
    refreshChallengeProgress();
    updateRemainingInfo();
}

function removeRouletteSaved(rank) {
    rouletteState.saved = rouletteState.saved.filter((s) => s.rank !== rank);
    persistRouletteSaved();
    refreshRoulette();
}

function exportRoulette() {
    const data = rouletteState.saved;
    if (!data.length) {
        alert("Nothing saved yet.");
        return;
    }
    const csvCell = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const header = "Rank,Name,Creator,Percentage,Points,Date";
    const rows = data.map(
        (s) => `${s.rank},${csvCell(s.name)},${csvCell(s.creator)},${s.pct},${calcScore(s.rank, s.pct)},${s.savedAt.slice(0, 10)}`,
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chuddy-roulette-results.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function clearRoulette() {
    if (!confirm("Clear all saved roulette results?")) return;
    rouletteState.saved = [];
    rouletteState.pool = null;
    try {
        localStorage.removeItem("rouletteList");
    } catch {}
    document.getElementById("rouletteSaveRow").hidden = true;
    refreshRoulette();
}
