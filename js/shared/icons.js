// ═══════════════════════════════════════════════════════════════════════════════
// ICONS + FLAGS — inline SVG instead of emojis, so everything renders the same
// on every OS and picks up the theme colour via currentColor.
//   icon("search")             → <svg …>
//   <span data-icon="search">  → replaced by hydrateIcons() for static HTML
//   flagHTML("🇩🇪")            → <img src="assets/flags/de.svg">
// ═══════════════════════════════════════════════════════════════════════════════
const ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" fill="currentColor" stroke="none"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    "half-circle": '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none"/>',
    circle: '<circle cx="12" cy="12" r="9"/>',
    crown: '<path d="M3 7.5 7.5 11 12 4l4.5 7L21 7.5 19 18H5Z"/><path d="M5 21h14"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4"/><path d="M17 6h2.5a2.5 2.5 0 0 1-2.6 4"/><path d="M12 14v4"/><path d="M8 21h8"/><path d="M9.5 18h5"/>',
    medal: '<path d="M7.5 2h3l2 5"/><path d="M16.5 2h-3l-1.6 4"/><circle cx="12" cy="15" r="6"/><path d="M12 12.5v5"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3.5 6h.01"/><path d="M3.5 12h.01"/><path d="M3.5 18h.01"/>',
    shuffle:
        '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h.01"/><path d="M16 8h.01"/><path d="M12 12h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/>',
    save: '<path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M7 3v5h8V3"/><path d="M7 21v-7h10v7"/>',
    skip: '<path d="M5 5v14l10-7Z"/><path d="M19 5v14"/>',
    external: '<path d="M14 4h6v6"/><path d="M10 14 20 4"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 19h16"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    palette:
        '<path d="M12 3a9 9 0 0 0 0 18c1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3Z"/><circle cx="7.5" cy="11.5" r="1" fill="currentColor"/><circle cx="10" cy="7.5" r="1" fill="currentColor"/><circle cx="15" cy="7.5" r="1" fill="currentColor"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M22 21a7 7 0 0 0-4-6.3"/>',
    skull: '<path d="M8 21v-3.2A7.5 7.5 0 1 1 16 17.8V21Z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M12 21v-2.5"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10.5 5-3v9l-5-3"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
    hash: '<path d="M5 9h14"/><path d="M5 15h14"/><path d="M10 4 8 20"/><path d="M16 4l-2 16"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    // ── admin panel ──
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    pencil: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/><path d="m14.5 5.5 3 3"/>',
    "arrow-up": '<path d="m6 11 6-6 6 6"/><path d="M12 5v14"/>',
    "arrow-down": '<path d="m6 13 6 6 6-6"/><path d="M12 19V5"/>',
    "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M3 21v-5h5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3"/><path d="m16 7 3 3"/><path d="m18 5 2 2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    alert: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
};

function icon(name, cls = "") {
    const paths = ICON_PATHS[name];
    if (!paths) return "";
    return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

// Swap every <span data-icon="name"> in the static HTML for its SVG
function hydrateIcons(root = document) {
    root.querySelectorAll("[data-icon]").forEach((el) => {
        el.outerHTML = icon(el.dataset.icon, el.className);
    });
}

// ── FLAGS ────────────────────────────────────────────────────────────────────
// Flags are stored as emoji in the database ("🇩🇪"). Windows can't draw flag
// emoji, so they're converted to an ISO code and shown as an image instead.
// Countries in LOCAL_FLAGS are bundled in assets/flags/; others load from flagcdn.
const LOCAL_FLAGS = new Set(["de", "us", "gb", "it"]);

function flagCode(emoji) {
    const cps = [...String(emoji || "")].map((c) => c.codePointAt(0));
    // Regional indicator pair: 🇩🇪 → "de"
    if (cps.length === 2 && cps.every((c) => c >= 0x1f1e6 && c <= 0x1f1ff)) {
        return cps.map((c) => String.fromCharCode(c - 0x1f1e6 + 97)).join("");
    }
    // Tag sequence: 🏴 + "gbeng" tags → "gb-eng" (England, Scotland, Wales)
    if (cps[0] === 0x1f3f4 && cps.length > 2) {
        const tags = cps
            .slice(1)
            .filter((c) => c >= 0xe0061 && c <= 0xe007a)
            .map((c) => String.fromCharCode(c - 0xe0000))
            .join("");
        if (tags.length > 2) return `${tags.slice(0, 2)}-${tags.slice(2)}`;
    }
    return null;
}

function flagHTML(emoji, cls = "") {
    const code = flagCode(emoji);
    if (!code) return `<span class="flag flag-none ${cls}" title="Unknown country">${icon("globe")}</span>`;
    const src = LOCAL_FLAGS.has(code) ? `assets/flags/${code}.svg` : `https://flagcdn.com/${code}.svg`;
    const label = code.toUpperCase();
    return `<img class="flag ${cls}" src="${src}" alt="${label}" title="${label}" loading="lazy" />`;
}
