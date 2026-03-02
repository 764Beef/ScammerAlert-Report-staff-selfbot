const path = require("path");
const Database = require("better-sqlite3");
const db = new Database(path.join(__dirname, "../data/leaderboard.db"));

const ENABLE_FETCH = false;

db.prepare(`CREATE TABLE IF NOT EXISTS reports (
    userID TEXT,
    username TEXT,
    timestamp INTEGER,
    messageID TEXT
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
)`).run();

function getLastFetchedID() {
    const row = db.prepare(`SELECT value FROM meta WHERE key = 'lastMessageID'`).get();
    return row ? row.value : null;
}

function setLastFetchedID(id) {
    db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('lastMessageID', ?)`).run(id);
}

const REPORT_CHANNEL_ID = "888763423775657984";
const MODERATOR_ROLE_IDS = [
    "888763378833711164",
    "888763376895942697",
    "888763380888895499"
];

async function processMessage(msg, guild) {
    if (!msg.embeds?.length || !msg.createdTimestamp) return;

    const embed = msg.embeds[0];
    const fields = embed.fields || [];

    const qualifyingMods = new Map();

    const ticketFields = fields.filter(field =>
        field.name?.toLowerCase().includes("users in ticket")
    );

    for (const field of ticketFields) {
        const lines = field.value.split("\n");
        for (const line of lines) {
            const idMatch = line.match(/<@!?(\d{17,20})>/);
            if (!idMatch) continue;

            const userID = idMatch[1];
            const modMember = await guild.members.fetch(userID).catch(() => null);
            if (!modMember) continue;

            const hasModRole = MODERATOR_ROLE_IDS.some(roleID =>
                modMember.roles.cache.has(roleID)
            );

            if (hasModRole) {
                qualifyingMods.set(userID, modMember.user.tag);
                console.log(`[REPORTS]  Credited mod: ${modMember.user.tag} (${userID})`);
            } else {
                console.log(`[REPORTS]  Skipped non-mod: ${modMember.user.tag} (${userID})`);
            }
        }
    }

    if (qualifyingMods.size === 0) {
        console.log(`[REPORTS]  No qualifying mods found in message ${msg.id}`);
        return;
    }

    for (const [userID, username] of qualifyingMods.entries()) {
        try {
            db.prepare(`
                INSERT INTO reports (userID, username, timestamp, messageID)
                VALUES (?, ?, ?, ?)
            `).run(userID, username, msg.createdTimestamp, msg.id);

            console.log(`[REPORTS] +1 → ${username} (${userID})`);
        } catch (err) {
            console.log(`[REPORTS]  DB insert failed: ${err.message}`);
        }
    }
}

module.exports = {
    processMessage,
    reportTranscripts: async function (client) {
        console.log("[REPORTS] reportTranscripts.js is running...");

        if (!ENABLE_FETCH) {
            console.log("[REPORTS] Skipped transcript fetch — toggle is disabled.");
            return;
        }

        const channel = client.channels.cache.get(REPORT_CHANNEL_ID);
        if (!channel || !channel.guild) {
            console.log("[REPORTS]  Channel or guild not found — check cache or IDs.");
            return;
        }

        const guild = channel.guild;
        console.log(`[REPORTS]  Found channel ${channel.id} in guild ${guild.id}`);

        let lastID = getLastFetchedID();
        let batchCount = 0;

        while (true) {
            const options = { limit: 100 };
            if (lastID) options.before = lastID;

            const messages = await channel.messages.fetch(options).catch(err => {
                console.log(`[REPORTS]  Failed to fetch messages: ${err.message}`);
                return null;
            });

            if (!messages || messages.size === 0) {
                console.log("[REPORTS]  Backfill complete — no more messages.");
                break;
            }

            console.log(`[REPORTS]  Fetched ${messages.size} messages`);

            const sortedMessages = [...messages.values()].sort((a, b) => b.createdTimestamp - a.createdTimestamp);

            batchCount++;
            for (const msg of sortedMessages) {
                await processMessage(msg, guild);
            }

            const oldestMsg = sortedMessages[sortedMessages.length - 1];
            if (oldestMsg?.id) {
                lastID = oldestMsg.id;
                setLastFetchedID(lastID);
            }

            await new Promise(res => setTimeout(res, 1500));
        }

        console.log(`[REPORTS]  Backfill finished (${batchCount} batches)`);
    }
};
