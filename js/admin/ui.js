// ═══════════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════════
let toastTimer;
const TOAST_ICONS = { success: "check-circle", error: "alert", info: "refresh" };

function toast(msg, type = "success") {
    const el = document.getElementById("toast");
    el.innerHTML = `${icon(TOAST_ICONS[type] || "check-circle")}<span>${esc(msg)}</span>`;
    el.className = `show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), type === "error" ? 5000 : 3000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRM DIALOG — styled replacement for confirm(); resolves true / false
//   if (!(await confirmDialog("Delete X?", "This can't be undone."))) return;
// ═══════════════════════════════════════════════════════════════════════════════
let confirmResolve = null;

function confirmDialog(title, text, okLabel = "Delete") {
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmText").textContent = text;
    document.getElementById("confirmOk").textContent = okLabel;
    document.getElementById("confirmModal").classList.add("open");
    setTimeout(() => document.getElementById("confirmCancel").focus(), 30);
    return new Promise((resolve) => (confirmResolve = resolve));
}

function settleConfirm(result) {
    document.getElementById("confirmModal").classList.remove("open");
    if (confirmResolve) confirmResolve(result);
    confirmResolve = null;
}

document.getElementById("confirmOk").addEventListener("click", () => settleConfirm(true));
document.getElementById("confirmCancel").addEventListener("click", () => settleConfirm(false));

// Small stat card, same markup as the public site's
function statCard(iconName, tone, value, label) {
    return `<div class="stat-card">
      <div class="stat-icon ${tone}">${icon(iconName)}</div>
      <div class="stat-text"><div class="stat-val">${value}</div><div class="stat-lbl">${label}</div></div>
    </div>`;
}

// Medal / top-10 colour class for a list position (matches the public site)
function rankClass(rank) {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    if (rank <= 10) return "rank-top10";
    return "";
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL SWITCHING
// ═══════════════════════════════════════════════════════════════════════════════
function showPanel(name) {
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${name}`));
    document.querySelectorAll(".admin-nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.panel === name));
    try {
        sessionStorage.setItem("adminPanel", name);
    } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add("open");
    // Focus the first visible field so you can start typing straight away
    setTimeout(() => modal.querySelector("input:not([type=hidden]), select")?.focus(), 30);
}

function closeModal(id) {
    document.getElementById(id).classList.remove("open");
}

// Close on overlay click (the confirm dialog counts that as "Cancel")
document.querySelectorAll(".modal-overlay").forEach((o) => {
    o.addEventListener("click", (e) => {
        if (e.target !== o) return;
        if (o.id === "confirmModal") settleConfirm(false);
        else o.classList.remove("open");
    });
});

// Close on Escape
document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.getElementById("confirmModal").classList.contains("open")) return settleConfirm(false);
    document.querySelectorAll(".modal-overlay.open").forEach((o) => o.classList.remove("open"));
});

// Live helper text under a YouTube field showing the ID that will be saved
function previewVideoId(inputId, previewId) {
    const raw = document.getElementById(inputId).value;
    const preview = document.getElementById(previewId);
    if (!raw.trim()) {
        preview.textContent = "";
        return;
    }
    const id = extractYouTubeId(raw);
    preview.innerHTML = /^[a-zA-Z0-9_-]{11}$/.test(id)
        ? `${icon("check")}Will save as ID <span class="ok">${esc(id)}</span>`
        : `<span class="warn">${icon("alert")} "${esc(id)}" doesn't look like a YouTube video ID</span>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSY GUARD — prevents double-submits while a multi-step write is running
// ═══════════════════════════════════════════════════════════════════════════════
let busy = false;

async function runTask(fn, successMsg) {
    if (busy) {
        toast("Still working on the last change…", "info");
        return false;
    }
    busy = true;
    document.body.style.cursor = "progress";
    try {
        await fn();
        if (successMsg) toast(successMsg, "success");
        return true;
    } catch (e) {
        toast("Error: " + e.message, "error");
        return false;
    } finally {
        busy = false;
        document.body.style.cursor = "";
        await loadAll();
    }
}
