const path = require("path");
const Database = require("better-sqlite3");
const db = new Database(path.join(__dirname, "../data/leaderboard.db"));

const REPORT_CHANNEL_ID = "888763423775657984";
const MODERATOR_ROLE_IDS = [
    "888763378833711164",
    "888763376895942697",
    "888763380888895499"
];

module.exports = async function handleRElbCommand(message, args, client) {
    await message.delete().catch(() => {});
    const channel = client.channels.cache.get(REPORT_CHANNEL_ID);

    if (!channel || !channel.guild || !channel.messages) {
        console.log("[RELB] Channel or guild not found.");
        await message.channel.send({
            content: "Report channel not found.",
            flags: 4096,
            allowedMentions: { parse: [] }
        }).catch(() => {});
        return;
    }

    const guild = channel.guild;
    const messages = await channel.messages.fetch({ limit: 50 }).catch(err => {
        console.log(`[RELB] Failed to fetch messages: ${err.message}`);
        return null;
    });

    if (!messages || messages.size === 0) {
        await message.channel.send({
            content: "No messages found to recache",
            flags: 4096,
            allowedMentions: { parse: [] }
        }).catch(() => {});
        return;
    }

    console.log(`[RELB]  Reprocessing ${messages.size} recent messages`);

    const sortedMessages = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    let totalInserts = 0;

    for (const msg of sortedMessages) {
        if (!msg.embeds?.length || !msg.createdTimestamp) continue;

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
                    console.log(`[RELB]  Credited mod: ${modMember.user.tag} (${userID})`);
                } else {
                    console.log(`[RELB] Skipped non-mod: ${modMember.user.tag} (${userID})`);
                }
            }
        }

        for (const [userID, username] of qualifyingMods.entries()) {
            try {
                db.prepare(`
                    INSERT INTO reports (userID, username, timestamp, messageID)
                    VALUES (?, ?, ?, ?)
                `).run(userID, username, msg.createdTimestamp, msg.id);
                totalInserts++;
                console.log(`[RELB] +1 → ${username} (${userID})`);
            } catch (err) {
                console.log(`[RELB]  DB insert failed for ${userID}: ${err.message}`);
            }
        }
    }

    await message.channel.send({
        content: `Recached ${messages.size} messages. ${totalInserts} new inserts added.`,
        flags: 4096,
        allowedMentions: { parse: [] }
    }).catch(() => {});
};
