const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../data/marks.db'));

module.exports = async function handleLsCommand(message, args) {
    await message.delete().catch(() => {});

    const [searchTerm, flag] = args;
    if (!searchTerm || !/^\d{17,19}$/.test(searchTerm)) {
        await message.channel.send("Usage: `.ls <id-in-content> [s|d]`").catch(() => {});
        return;
    }

    let query = "SELECT * FROM marks WHERE content LIKE ?";
    let params = [`%${searchTerm}%`];

    if (flag === "s" || flag === "d") {
        query += " AND channelType = ?";
        params.push(flag);
    }

    let rows;
    try {
        rows = db.prepare(query).all(...params);
    } catch (err) {
        console.error("[ERROR] Failed to query marks:", err);
        await message.channel.send("Error retrieving listings.").catch(() => {});
        return;
    }

    if (rows.length === 0) {
        await message.channel.send(`No listings found containing \`${searchTerm}\`.`).catch(() => {});
        return;
    }

    let header = `<a:leaderboardsa:1370912436106035260> **Listings containing \`${searchTerm}\`**\n\n`;
    let messagesToSend = [];
    let currentMessage = header;

    for (const row of rows) {
        const time = `<t:${Math.floor(row.timestamp / 1000)}:R>`;
        const preview = row.content.length > 200
            ? row.content.slice(0, 197) + "..."
            : row.content;

        const link = row.messageLink || "(no link)";
        const channelMention = row.channelID ? `<#${row.channelID}>` : `#${row.channelName || row.channelType}`;

        const entry = `• ${channelMention} | ${time}\n  ↳ ${preview}\n  <a:staffsa:1358876490263040293> [View Listing](${link})\n\n`;

        if (currentMessage.length + entry.length > 2000) {
            messagesToSend.push(currentMessage);
            currentMessage = entry;
        } else {
            currentMessage += entry;
        }
    }

    if (currentMessage.length > 0) messagesToSend.push(currentMessage);

    for (const part of messagesToSend) {
        await message.channel.send({
            content: part,
            flags: 4096,
            allowedMentions: { parse: [] }
        }).catch(() => {});
    }

    console.log(`[LS] Sent ${messagesToSend.length} listing message(s) for content search: ${searchTerm}`);
};
