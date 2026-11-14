// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE FETCH  (gracefully falls back to placeholder)
// ═══════════════════════════════════════════════════════════════════════════════
function sbGet(path) {
    return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
    }).then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
    });
}

async function loadData() {
    // If creds are still placeholders, use demo data silently
    if (SUPABASE_URL.includes("YOUR_") || SUPABASE_ANON_KEY.includes("YOUR_")) {
        setDemons(PLACEHOLDER);
        return;
    }

    showStatus("Connecting to Supabase…", true);
    try {
        // Fetch demons + their records in two calls, then join client-side
        const [demons, records] = await Promise.all([
            sbGet("demons?select=*&order=rank.asc"),
            sbGet("records?select=*,players(name,flag)"),
        ]);

        const byDemon = {};
        records.forEach((r) => {
            if (!r.players) return; // orphaned record
            (byDemon[r.demon_id] ||= []).push({
                player: r.players.name,
                pct: r.percentage,
                flag: r.players.flag || "🌐",
                attempts: r.attempts || null,
                video: r.video_id || null, // player's own completion video
                createdAt: r.created_at,
            });
        });

        setDemons(
            demons.map((d) => {
                const demonRecords = byDemon[d.id] || [];
                markFirstVictor(demonRecords);
                return {
                    rank: d.rank,
                    name: d.name,
                    creator: d.creator,
                    video: d.video_id,
                    levelId: d.level_id || null,
                    challenge: !!d.is_challenge,
                    records: demonRecords,
                };
            }),
        );

        usingSupabase = true;
        showStatus("Live data loaded", false, 2500);
    } catch (e) {
        console.warn("Supabase unavailable, using placeholder data.", e);
        setDemons(PLACEHOLDER);
        showStatus("Using demo data (Supabase unreachable)", false, 3000);
    }
}

// Marks the earliest 100% completion as the first victor
function markFirstVictor(records) {
    const fullClears = records.filter((r) => r.pct === 100 && r.createdAt);
    if (!fullClears.length) return;
    const earliest = fullClears.reduce((a, b) => (new Date(a.createdAt) < new Date(b.createdAt) ? a : b));
    earliest.isFirstVictor = true;
}
