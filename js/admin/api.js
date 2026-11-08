// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// The admin signs in with a Supabase Auth account (email + password) and uses
// the same browser-safe public key as the site (js/site/config.js). Write access
// comes from the RLS policies in supabase_admin_auth.sql, not from a secret key —
// Supabase refuses secret keys in the browser.
// ═══════════════════════════════════════════════════════════════════════════════
const SB_URL = SUPABASE_URL.replace(/\/$/, "");
const SB_KEY = SUPABASE_ANON_KEY;

let session = null; // { access_token, refresh_token, expires_at (ms), email }
let refreshTimer = null;

// ── AUTH ─────────────────────────────────────────────────────────────────────
async function authRequest(path, body, token) {
    const res = await fetch(`${SB_URL}/auth/v1/${path}`, {
        method: "POST",
        headers: { apikey: SB_KEY, "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error_description || json.msg || json.message || res.statusText);
    return json;
}

function setSession(json) {
    session = {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        expires_at: Date.now() + (json.expires_in || 3600) * 1000,
        email: json.user?.email || session?.email || "",
    };
    onSessionChange(session); // auth.js persists the refresh token
    // Refresh a minute before the access token runs out
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refreshSession().catch(() => {}), Math.max(10_000, session.expires_at - Date.now() - 60_000));
}

async function signInWithPassword(email, password) {
    setSession(await authRequest("token?grant_type=password", { email, password }));
}

async function refreshSession(refreshToken = session?.refresh_token) {
    if (!refreshToken) throw new Error("Not signed in");
    setSession(await authRequest("token?grant_type=refresh_token", { refresh_token: refreshToken }));
}

async function signOutSession() {
    clearTimeout(refreshTimer);
    if (session) await authRequest("logout", null, session.access_token).catch(() => {});
    session = null;
}

// ── REST ─────────────────────────────────────────────────────────────────────
async function sbFetch(path, options = {}, retried = false) {
    if (session && Date.now() > session.expires_at - 30_000) await refreshSession();
    const r = await fetch(SB_URL + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            apikey: SB_KEY,
            Authorization: `Bearer ${session ? session.access_token : SB_KEY}`,
            Prefer: "return=representation",
            ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    // Expired token: refresh once and retry
    if (r.status === 401 && session && !retried) {
        await refreshSession();
        return sbFetch(path, options, true);
    }
    if (!r.ok) {
        const err = await r.json().catch(() => ({ message: r.statusText }));
        if (err.code === "42501") throw new Error("Your account isn't allowed to change data — check supabase_admin_auth.sql");
        // demons_rank_positive (supabase_rank_check.sql): only outdated admin copies hit this
        if (err.code === "23514" && /rank/.test(err.message)) {
            throw new Error("Ranks must be 1 or higher — if you didn't type a rank below 1, your admin files are outdated");
        }
        throw new Error(err.message || r.statusText);
    }
    return r.status === 204 ? null : r.json();
}

// Is the signed-in account in the admins list? (function from supabase_admin_auth.sql)
async function checkIsAdmin() {
    try {
        return (await sbFetch("/rest/v1/rpc/is_admin", { method: "POST", body: {} })) === true;
    } catch (e) {
        if (/is_admin|function|404/i.test(e.message)) throw new Error("Run supabase_admin_auth.sql in Supabase first");
        throw e;
    }
}

// RLS hides rows you may not change, so a blocked update "succeeds" with 0 rows —
// treat that as an error instead of silently doing nothing.
async function sbPatch(table, id, body) {
    const rows = await sbFetch(`/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", body });
    if (Array.isArray(rows) && rows.length === 0) throw new Error("Change was blocked — is your account an admin?");
    return rows;
}
const sbDelete = (table, filter) => sbFetch(`/rest/v1/${table}?${filter}`, { method: "DELETE" });
const sbInsert = (table, body) => sbFetch(`/rest/v1/${table}`, { method: "POST", body });
