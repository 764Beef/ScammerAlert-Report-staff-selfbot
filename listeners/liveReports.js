const path = require("path");
const Database = require("better-sqlite3");
const db = new Database(path.join(__dirname, "../data/leaderboard.db"));

const REPORT_CHANNEL_ID = "888763423775657984";
const MODERATOR_ROLE_IDS = [
    "888763378833711164",
    "888763376895942697",
    "888763380888895499"
];

module.exports = function liveReportListener(client) {
    client.on("messageCreate", async (msg) => {
        if (msg.channelId !== REPORT_CHANNEL_ID) return;
        if (!msg.embeds?.length || !msg.createdTimestamp) return;

        const guild = msg.guild || client.guilds.cache.get(msg.guildId);
        if (!guild) {
            console.log("[LIVE REPORTS]  Guild not found for live tracking.");
            return;
        }

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
                    console.log(`[LIVE REPORTS]  Credited mod: ${modMember.user.tag} (${userID})`);
                } else {
                    console.log(`[LIVE REPORTS]  Skipped non-mod: ${modMember.user.tag} (${userID})`);
                }
            }
        }

        if (qualifyingMods.size === 0) {
            console.log(`[LIVE REPORTS]  No qualifying mods found in message ${msg.id}`);
            return;
        }

        for (const [userID, username] of qualifyingMods.entries()) {
            try {
                db.prepare(`
                    INSERT INTO reports (userID, username, timestamp, messageID)
                    VALUES (?, ?, ?, ?)
                `).run(userID, username, msg.createdTimestamp, msg.id);

                console.log(`[LIVE REPORTS] +1 → ${username} (${userID})`);
            } catch (err) {
                console.log(`[LIVE REPORTS]  DB insert failed for ${userID}: ${err.message}`);
            }
        }
    });

    console.log("[LIVE REPORTS]  Live report listener is active.");
};

