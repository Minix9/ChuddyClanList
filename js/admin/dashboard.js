// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function renderDashboard() {
    const completions = records.filter((r) => r.percentage === 100);
    document.getElementById("dashStats").innerHTML = [
        statCard("skull", "", demons.length, "Demons"),
        statCard("trophy", "gold", records.length, "Records"),
        statCard("check-circle", "green", completions.length, "Completions"),
        statCard("users", "neutral", players.length, "Players"),
    ].join("");

    // records are already ordered newest first by loadAll()
    const recent = records.slice(0, 8);
    document.getElementById("recentRecords").innerHTML = recent.length
        ? recent
              .map(
                  (r) => `
        <tr>
          <td><span class="cell-player">${flagHTML(r.players?.flag)}${esc(r.players?.name || "?")}</span></td>
          <td><span class="rank-badge ${rankClass(r.demons?.rank)}">#${r.demons?.rank}</span> ${esc(r.demons?.name || "?")}</td>
          <td class="num"><span class="pct ${r.percentage === 100 ? "full" : ""}">${r.percentage}%</span></td>
          <td class="num muted">${formatShortDate(r.created_at) || "—"}</td>
        </tr>`,
              )
              .join("")
        : `<tr><td class="empty-table">No records yet</td></tr>`;

    // Levels nobody has completed yet, with the best progress so far
    const beaten = new Set(completions.map((r) => r.demon_id));
    const unbeaten = demons.filter((d) => !beaten.has(d.id));
    document.getElementById("unbeatenLevels").innerHTML = unbeaten.length
        ? unbeaten
              .map((d) => {
                  const best = records.filter((r) => r.demon_id === d.id).sort((a, b) => b.percentage - a.percentage)[0];
                  return `
        <tr>
          <td><span class="rank-badge ${rankClass(d.rank)}">#${d.rank}</span> ${esc(d.name)}</td>
          <td class="num">${
              best
                  ? `<span class="muted">${esc(best.players?.name || "?")}</span> <span class="pct">${best.percentage}%</span>`
                  : '<span class="muted">No progress yet</span>'
          }</td>
        </tr>`;
              })
              .join("")
        : `<tr><td class="empty-table">Every level has been beaten</td></tr>`;
}
