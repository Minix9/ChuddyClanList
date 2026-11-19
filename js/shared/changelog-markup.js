// ═══════════════════════════════════════════════════════════════════════════════
// CHANGELOG MARKUP — the small text format changelog entries are written in.
// Used by the site (Changelog tab) and the admin editor's live preview, so both
// always look the same.
//
//   Plain lines              paragraph (lines next to each other join up)
//   **bold**                 bold
//   [[Level name]]           link to that level's page   ([[Name]] #64 also shows a rank)
//   [[@Player]]              link to that player's profile
//   ## Label                 small section label
//   - item                   bullet point
//   +31 [[Level name]] #64   climb row (green ↑31)  — rows next to each other form a list
//   -32 [[Level name]] #191  drop row  (red ↓32)
//   new [[Level name]] #12   newly placed level ("New" badge)
//   Two "label + rows" sections directly after each other sit side by side.
// ═══════════════════════════════════════════════════════════════════════════════
const MOVE_LINE = /^(?:([+-])(\d+)|new)\s+\[\[(.+?)\]\](?:\s*#(\d+))?\s*$/i;

// Level links go by name, so they keep working when ranks change
function levelNameHref(name) {
    return `#/level/${encodeURIComponent(name)}`;
}

// isKnown(name, "level" | "player") (optional): false marks a link to something that doesn't exist
function changelogInline(text, isKnown) {
    return esc(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[\[(.+?)\]\](\s*#(\d+))?/g, (_, nameEsc, __, rank) => {
            const name = nameEsc.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            const player = name.startsWith("@");
            const target = player ? name.slice(1).trim() : name;
            const missing = isKnown && !isKnown(target, player ? "player" : "level") ? " cl-missing" : "";
            const href = player ? `#/player/${encodeURIComponent(target)}` : levelNameHref(target);
            return `<a class="text-link${missing}" href="${esc(href)}">${esc(target)}</a>${rank ? ` <span class="count">#${rank}</span>` : ""}`;
        });
}

// Splits the text into blocks: paragraph / label / bullets / moves
function changelogBlocks(body) {
    const blocks = [];
    const last = () => blocks[blocks.length - 1];
    for (const raw of String(body || "").split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) {
            blocks.push({ type: "gap" });
            continue;
        }
        const move = line.match(MOVE_LINE);
        if (line.startsWith("## ")) blocks.push({ type: "label", text: line.slice(3).trim() });
        else if (move) {
            const item = { kind: !move[1] ? "new" : move[1] === "+" ? "up" : "down", by: move[2], name: move[3], rank: move[4] };
            if (last()?.type === "moves") last().items.push(item);
            else blocks.push({ type: "moves", items: [item] });
        } else if (/^[-*] /.test(line)) {
            if (last()?.type === "bullets") last().items.push(line.slice(2));
            else blocks.push({ type: "bullets", items: [line.slice(2)] });
        } else if (last()?.type === "para") last().text += " " + line;
        else blocks.push({ type: "para", text: line });
    }
    return blocks.filter((b) => b.type !== "gap");
}

function changelogBodyHTML(body, isKnown) {
    const blocks = changelogBlocks(body);
    const html = (b) => {
        if (b.type === "label") return `<span class="label">${esc(b.text)}</span>`;
        if (b.type === "para") return `<p class="cl-lead">${changelogInline(b.text, isKnown)}</p>`;
        if (b.type === "bullets") return `<ul class="cl-bullets">${b.items.map((t) => `<li>${changelogInline(t, isKnown)}</li>`).join("")}</ul>`;
        return `<ul class="rows">${b.items
            .map(
                (m) => `<li class="row">${changelogInline(`[[${m.name}]]`, isKnown).replace("text-link", "row-main text-link")}${m.rank ? `<span class="count">#${m.rank}</span>` : ""}${
                    m.kind === "new" ? `<span class="badge badge-accent">New</span>` : `<span class="${m.kind}">${icon(`arrow-${m.kind}`)}${m.by}</span>`
                }</li>`,
            )
            .join("")}</ul>`;
    };
    let out = "";
    for (let i = 0; i < blocks.length; i++) {
        const [a, b, c, d] = blocks.slice(i, i + 4);
        // label+rows, label+rows → two columns
        if (a.type === "label" && b?.type === "moves" && c?.type === "label" && d?.type === "moves") {
            out += `<div class="cl-columns"><div>${html(a)}${html(b)}</div><div>${html(c)}${html(d)}</div></div>`;
            i += 3;
        } else out += html(a);
    }
    return out;
}

// "2026-11-15" → "Nov 15, 2026" (read as a local date, so it never shifts a day)
function changelogDate(day) {
    const [y, m, d] = String(day).split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Link to one entry. The first 8 characters of its id are enough and keep shared links short.
const changelogHref = (entry) => `#/changelog/${entry.id.slice(0, 8)}`;

// What the Copy link buttons copy, written for Discord: the title, the first paragraph,
// what moved (up to 3 rows per list) and the link
function changelogShareText(entry) {
    const escMd = (s) => String(s).replace(/([\\*_~`|])/g, "\\$1");
    const blocks = changelogBlocks(entry.body);
    const lines = [`**${entry.title}** · Chuddy List changelog`];

    const lead = blocks.find((b) => b.type === "para")?.text.replace(/\[\[@?(.+?)\]\]/g, (_, n) => escMd(n.trim()));
    if (lead) lines.push(lead.length > 280 ? lead.slice(0, 279).trimEnd() + "…" : lead);

    const rows = [];
    let more = 0;
    for (const b of blocks.filter((b) => b.type === "moves")) {
        const moved = b.items.filter((m) => m.kind !== "new"); // new levels are left out
        rows.push(...moved.slice(0, 3));
        more += Math.max(0, moved.length - 3);
    }
    for (const m of rows) {
        const to = m.rank ? ` → #${m.rank}` : "";
        lines.push(`${m.kind === "up" ? `▲ **${escMd(m.name)}** up` : `▼ **${escMd(m.name)}** down`} ${m.by}${to}`);
    }
    if (more) lines.push(`…and ${more} more`);

    lines.push(SITE_URL + changelogHref(entry));
    return lines.join("\n");
}

// One full entry: { id, title, tag, body, published_on }
function changelogEntryHTML(entry, isKnown) {
    return `<article class="cl-entry"${entry.id ? ` id="cl-${esc(entry.id.slice(0, 8))}"` : ""}>
      <div class="cl-meta">
        <time class="cl-date" datetime="${esc(entry.published_on)}">${esc(changelogDate(entry.published_on))}</time>
        ${entry.tag ? `<span class="badge badge-accent">${esc(entry.tag)}</span>` : ""}
        ${entry.id ? `<button class="btn btn-ghost btn-sm" data-copy="${esc(changelogShareText(entry))}" data-copied="Link copied">${icon("copy")}Copy link</button>` : ""}
      </div>
      <div class="cl-body">
        <h2>${esc(entry.title)}</h2>
        ${changelogBodyHTML(entry.body, isKnown)}
      </div>
    </article>`;
}
