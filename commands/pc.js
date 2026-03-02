const path = require("path");
const Database = require("better-sqlite3");
const db = new Database(path.join(__dirname, "../data/leaderboard.db"));

const REPORT_CHANNEL_ID = "888763423775657984";
const MODERATOR_ROLE_IDS = [
    "888763378833711164",
    "888763376895942697",
    "888763380888895499"
];

module.exports = async function handleRepachCommand(message) {
    const client = message.client;
    await message.delete().catch(() => {});

    const channel = client.channels.cache.get(REPORT_CHANNEL_ID);
    if (!channel || !channel.guild || !channel.messages) {
        console.log("[REPACH]  Channel or guild not found or unsupported.");
        await message.channel.send({
            content: " Channel or guild not found.",
            flags: 4096,
            allowedMentions: { parse: [] }
        }).catch(() => {});
        return;
    }

    const guild = channel.guild;

    const incompleteMessages = db.prepare(`
        SELECT messageID
        FROM reports
        GROUP BY messageID
        HAVING COUNT(*) = 1
    `).all();

    if (incompleteMessages.length === 0) {
        console.log("[REPACH]  No incomplete messages found.");
        await message.channel.send({
            content: "No incomplete messages found.",
            flags: 4096,
            allowedMentions: { parse: [] }
        }).catch(() => {});
        return;
    }

    console.log(`[REPACH] Found ${incompleteMessages.length} incomplete messages`);

    const statusMsg = await message.channel.send({
        content: `🔧 Reprocessing ${incompleteMessages.length} incomplete messages...`,
        flags: 4096,
        allowedMentions: { parse: [] }
    }).catch(() => null);

    const checkExisting = db.prepare(`
        SELECT 1 FROM reports WHERE userID = ? AND messageID = ?
    `);

    for (const { messageID } of incompleteMessages) {
        console.log(`[REPACH]  Reprocessing message ${messageID}`);

        let msg;
        try {
            msg = await channel.messages.fetch(messageID);
        } catch (err) {
            console.log(`[REPACH] Failed to fetch message ${messageID}: ${err.message}`);
            continue;
        }

        if (!msg || !msg.embeds?.length) {
            console.log(`[REPACH]  Skipped message ${messageID} — no embeds`);
            continue;
        }

        const embed = msg.embeds[0];
        const fields = embed.fields || [];
        const qualifyingMods = new Map();

        const ticketFields = fields.filter(field =>
            field.name?.toLowerCase().includes("users in ticket")
        );

        if (ticketFields.length === 0) {
            console.log(`[REPACH] No "Users in Ticket" field found in message ${messageID}`);
            continue;
        }

        for (const field of ticketFields) {
            const lines = field.value.split("\n");
            for (const line of lines) {
                const idMatch = line.match(/<@!?(\d{17,20})>/);
                if (!idMatch) {
                    console.log(`[REPACH]  No user mention found in line: "${line}"`);
                    continue;
                }

                const userID = idMatch[1];
                const modMember = await guild.members.fetch(userID).catch(() => null);
                if (!modMember) {
                    console.log(`[REPACH]  Could not fetch member: ${userID}`);
                    continue;
                }

                const hasModRole = MODERATOR_ROLE_IDS.some(roleID =>
                    modMember.roles.cache.has(roleID)
                );

                if (hasModRole) {
                    qualifyingMods.set(userID, modMember.user.tag);
                    console.log(`[REPACH]  Credited mod: ${modMember.user.tag} (${userID})`);
                } else {
                    console.log(`[REPACH]  Skipped non-mod: ${modMember.user.tag} (${userID})`);
                }
            }
        }

        if (qualifyingMods.size === 0) {
            console.log(`[REPACH]  No qualifying mods found in message ${messageID}`);
            continue;
        }

        for (const [userID, username] of qualifyingMods.entries()) {
            const alreadyExists = checkExisting.get(userID, messageID);
            if (alreadyExists) {
                console.log(`[REPACH]  Skipped duplicate for ${username} (${userID})`);
                continue;
            }

            try {
                db.prepare(`
                    INSERT INTO reports (userID, username, timestamp, messageID)
                    VALUES (?, ?, ?, ?)
                `).run(userID, username, msg.createdTimestamp, msg.id);

                console.log(`[REPACH] +1 → ${username} (${userID})`);
            } catch (err) {
                console.log(`[REPACH]  DB insert failed for ${userID}: ${err.message}`);
            }
        }
    }

    console.log("[REPACH]  Reprocessing complete.");

    if (statusMsg) {
        await statusMsg.edit({
            content: "Reprocessing complete.",
            flags: 4096,
            allowedMentions: { parse: [] }
        }).catch(() => {});
    }
};
