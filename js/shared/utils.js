// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UTILITIES — used by both index.html and admin.html
// Plain (non-module) script so everything keeps working when opened via file://
// ═══════════════════════════════════════════════════════════════════════════════

// Escapes a value for safe use inside innerHTML strings and HTML attributes.
// Every user-supplied string (player/level/creator names) must go through this.
function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// "Mar 4, 26" style short date, or "" if missing/invalid
function formatShortDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

// Pulls the video ID out of any common YouTube URL shape.
// If nothing matches, assumes the input already is a raw ID.
function extractYouTubeId(input) {
    if (!input) return "";
    const trimmed = input.trim();
    const m = trimmed.match(
        /(?:youtube\.com\/watch\?(?:.*&)?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    );
    return m ? m[1] : trimmed;
}

// size: "mqdefault" (320×180, small lists) or "hqdefault" (480×360, headers)
function youtubeThumb(videoId, size = "hqdefault") {
    return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${size}.jpg`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING FORMULA
// Exponential decay: rank 1 → 300 pts, last rank → 1 pt (at 100%).
// Partial completions scale linearly by percent:
//   e.g. rank-1 @ 90% = 270 pts, rank-1 @ 100% = 300 pts.
// ═══════════════════════════════════════════════════════════════════════════════
function calcPoints(rank, percent, listSize) {
    const n = listSize;
    rank = Math.min(Math.max(rank, 1), Math.max(n, 1)); // out-of-range ranks would give NaN
    if (n <= 1) return Math.round(300 * (percent / 100));
    // 300 * exp( -ln(300) / (n-1)^1.2  *  (rank-1)^1.2 )
    const base = 300 * Math.exp((-Math.log(300) / Math.pow(n - 1, 1.2)) * Math.pow(rank - 1, 1.2));
    return Math.max(0, Math.round(base * (percent / 100)));
}
