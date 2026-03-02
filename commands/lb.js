const path = require("path");
const Database = require("better-sqlite3");
const db = new Database(path.join(__dirname, "../data/leaderboard.db"));

function parseDateArg(parts) {
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month - 1, day).getTime();
}

module.exports = async function handleLbCommand(message, args) {
    await message.delete().catch(() => {});

    let filterFrom;

    if (args.length === 3) {
        filterFrom = parseDateArg(args);
        if (!filterFrom) {
            await message.channel.send({
                content: " Invalid date format. Use `DD MM YYYY`.",
                flags: 4096,
                allowedMentions: { parse: [] }
            }).catch(() => {});
            return;
        }
    } else {
        const now = new Date();
        filterFrom = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }

    const readableDate = new Date(filterFrom).toLocaleDateString("en-GB");
    console.log(`[LB] Filtering from timestamp: ${filterFrom} (${readableDate})`);

    const rows = db.prepare(`
        SELECT userID, COUNT(*) as reportsHandled
        FROM reports
        WHERE timestamp >= ?
        GROUP BY userID
        ORDER BY reportsHandled DESC
    `).all(filterFrom);

    if (rows.length === 0) {
        console.log("[LB] No rows matched filter — falling back to all-time leaderboard");

        const fallbackRows = db.prepare(`
            SELECT userID, COUNT(*) as reportsHandled
            FROM reports
            GROUP BY userID
            ORDER BY reportsHandled DESC
        `).all();

        if (fallbackRows.length === 0) {
            await message.channel.send({
                content: "No reports found.",
                flags: 4096,
                allowedMentions: { parse: [] }
            }).catch(() => {});
            return;
        }

        let leaderboardText = `<a:leaderboardsa:1370912436106035260> **Report Leaderboard (All Time)**\n\n`;
        for (const row of fallbackRows) {
            leaderboardText += `• <@${row.userID}> — ${row.reportsHandled} reports\n`;
        }

        await message.channel.send({
            content: leaderboardText,
            flags: 4096,
            allowedMentions: { parse: [] }
        }).catch(() => {});
        console.log(`[LB] Displayed fallback leaderboard (${fallbackRows.length} mods)`);
        return;
    }

    let leaderboardText = `<a:leaderboardsa:1370912436106035260> **Report Leaderboard (Since ${readableDate})**\n\n`;
    for (const row of rows) {
        leaderboardText += `• <@${row.userID}> — ${row.reportsHandled} reports\n`;
    }

    await message.channel.send({
        content: leaderboardText,
        flags: 4096,
        allowedMentions: { parse: [] }
    }).catch(() => {});

    console.log(`[LB] Displayed leaderboard from ${readableDate} (${rows.length} mods)`);
};
