const path = require("path");
const Database = require("better-sqlite3");
const db = new Database(path.join(__dirname, "../data/leaderboard.db"));

module.exports = async function handleCleanDupeCommand(message) {
    await message.delete().catch(() => {});

    const duplicates = db.prepare(`
        SELECT userID, messageID, COUNT(*) as count
        FROM reports
        GROUP BY userID, messageID
        HAVING count > 1
    `).all();

    if (duplicates.length === 0) {
        await message.channel.send({
            content: " No duplicate entries found.",
            flags: 4096,
            allowedMentions: { parse: [] }
        }).catch(() => {});
        return;
    }

    let totalRemoved = 0;

    const deleteStmt = db.prepare(`
        DELETE FROM reports
        WHERE userID = ? AND messageID = ?
    `);

    const insertStmt = db.prepare(`
        INSERT INTO reports (userID, username, timestamp, messageID)
        VALUES (?, ?, ?, ?)
    `);

    for (const { userID, messageID } of duplicates) {
        const rows = db.prepare(`
            SELECT * FROM reports
            WHERE userID = ? AND messageID = ?
            ORDER BY timestamp ASC
        `).all(userID, messageID);

        if (rows.length <= 1) continue;

        
        const [keep, ...dupes] = rows;

        deleteStmt.run(userID, messageID);
        insertStmt.run(keep.userID, keep.username, keep.timestamp, keep.messageID);

        totalRemoved += dupes.length;
        console.log(`[CLEANDUPE] Removed ${dupes.length} duplicates for ${userID} in message ${messageID}`);
    }

    await message.channel.send({
        content: `Removed ${totalRemoved} duplicate entries.`,
        flags: 4096,
        allowedMentions: { parse: [] }
    }).catch(() => {});
};
