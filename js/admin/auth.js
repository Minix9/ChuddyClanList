// ═══════════════════════════════════════════════════════════════════════════════
// AUTH — sign in with your Supabase Auth account (email + password)
// "Stay signed in" keeps the refresh token in localStorage so the next visit skips
// the login; otherwise it lives in sessionStorage (survives a refresh, not a
// closed tab). admin-local.html always stays signed in and has no sign-out.
// ═══════════════════════════════════════════════════════════════════════════════
const store = {
    get(area, key) {
        try {
            return window[area].getItem(key);
        } catch {
            return null;
        }
    },
    set(area, key, value) {
        try {
            window[area].setItem(key, value);
        } catch {}
    },
    remove(area, key) {
        try {
            window[area].removeItem(key);
        } catch {}
    },
};

const IS_LOCAL = typeof LOCAL_ADMIN !== "undefined";
const TOKEN_KEY = "sbRefreshToken";

function rememberArea() {
    return IS_LOCAL || document.getElementById("inputRemember").checked ? "localStorage" : "sessionStorage";
}

// Called by api.js whenever a new session/token arrives — keeps the stored token current
function onSessionChange(s) {
    store.remove("localStorage", TOKEN_KEY);
    store.remove("sessionStorage", TOKEN_KEY);
    if (s?.refresh_token) store.set(rememberArea(), TOKEN_KEY, s.refresh_token);
    if (s?.email) store.set("localStorage", "adminEmail", s.email);
}

function setLoginBusy(busy) {
    const btn = document.getElementById("loginBtn");
    btn.disabled = busy;
    btn.innerHTML = busy ? `${icon("refresh")}Signing in…` : `${icon("lock")}Sign in`;
}

async function doLogin() {
    const email = document.getElementById("inputEmail").value.trim();
    const pass = document.getElementById("inputPass").value;
    if (!email || !pass) {
        toast("Enter your email and password", "error");
        return;
    }
    setLoginBusy(true);
    try {
        await signInWithPassword(email, pass);
        await enterAdmin();
    } catch (e) {
        toast(e.message === "Invalid login credentials" ? "Wrong email or password" : e.message, "error");
        await signOutSession();
        onSessionChange(null);
    } finally {
        setLoginBusy(false);
        document.getElementById("inputPass").value = "";
    }
}

// After a successful sign-in: confirm admin rights, then show the panel
async function enterAdmin() {
    if (!(await checkIsAdmin())) {
        throw new Error(`Signed in as ${session.email}, but that account isn't an admin — add it in supabase_admin_auth.sql`);
    }
    document.getElementById("loginScreen").hidden = true;
    document.getElementById("adminScreen").hidden = false;
    document.getElementById("connDot").classList.add("live");
    document.getElementById("connLabel").textContent = session.email;
    showPanel(store.get("sessionStorage", "adminPanel") || "dashboard");
    await loadAll();
}

async function doLogout() {
    await signOutSession();
    onSessionChange(null);
    document.getElementById("inputPass").value = "";
    document.getElementById("loginScreen").hidden = false;
    document.getElementById("adminScreen").hidden = true;
    document.getElementById("connDot").classList.remove("live");
    document.getElementById("connLabel").textContent = "Signed out";
}

// On load: reuse a remembered session, so no login is needed
(async function restoreSession() {
    const email = store.get("localStorage", "adminEmail");
    if (email) document.getElementById("inputEmail").value = email;

    const token = store.get("localStorage", TOKEN_KEY) || store.get("sessionStorage", TOKEN_KEY);
    if (token) {
        if (store.get("localStorage", TOKEN_KEY)) document.getElementById("inputRemember").checked = true;
        try {
            await refreshSession(token);
            await enterAdmin();
            return;
        } catch {
            onSessionChange(null); // token expired or revoked — fall through to the login screen
        }
    }
    document.getElementById("loginScreen").hidden = false;
})();
