// ═══════════════════════════════════════════════════════════════════════════════
// CHUDDY CLAN — members and their YouTube channels (edit this list to change them)
// `name` must match the player name used for their records.
// ═══════════════════════════════════════════════════════════════════════════════
const CLAN_MEMBERS = [
    { name: "Minix", youtube: "https://www.youtube.com/@gdminix" },
    { name: "xyzJake", youtube: "https://www.youtube.com/@xyzjake" },
    { name: "gado", youtube: "https://www.youtube.com/@GadoGD" },
    { name: "Skyia321", youtube: "https://www.youtube.com/@skyia3212" },
    { name: "ThePastaNebula", youtube: "https://www.youtube.com/@ThePastaNebula" },
    { name: "Spaghetti", youtube: "https://www.youtube.com/@Spaghetti_GD" },
    { name: "therealGDF", youtube: "https://www.youtube.com/@therealgdf2009" },
    { name: "Muffin Cat", youtube: "https://www.youtube.com/@MuffinCat" },
    { name: "Fearme718", youtube: "https://www.youtube.com/@fearme7184" },
];

function clanMember(name) {
    const n = String(name).toLowerCase();
    return CLAN_MEMBERS.find((m) => m.name.toLowerCase() === n);
}
