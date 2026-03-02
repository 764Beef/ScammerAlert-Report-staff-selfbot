const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../data/marks.db'));

db.prepare(`
    CREATE TABLE IF NOT EXISTS marks (
        userID TEXT,
        username TEXT,
        messageID TEXT PRIMARY KEY,
        content TEXT,
        channelType TEXT,
        channelName TEXT,
        channelID TEXT,
        timestamp INTEGER,
        messageLink TEXT
    )
`).run();

function trackListings(client) {
    const validChannels = {
        "888763420055318559": "s",
        "888763420466364457": "d"
    };

   
    client.on("messageCreate", async (message) => {
        if (!message.guild || !message.channel || !message.author || !message.content) return;

        const channelType = validChannels[message.channel.id];
        if (!channelType) return;

        const entry = {
            userID: String(message.author.id),
            username: message.author.tag || "unknown",
            messageID: String(message.id),
            content: message.content.slice(0, 1000),
            channelType,
            channelName: message.channel.name,
            channelID: String(message.channel.id),
            timestamp: message.createdTimestamp,
            messageLink: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
        };

        try {
            db.prepare(`
                INSERT OR REPLACE INTO marks (userID, username, messageID, content, channelType, channelName, channelID, timestamp, messageLink)
                VALUES (@userID, @username, @messageID, @content, @channelType, @channelName, @channelID, @timestamp, @messageLink)
            `).run(entry);

            console.log(`[MARK] Saved listing from ${entry.username} in #${entry.channelName}`);
        } catch (err) {
            console.error("[ERROR] Failed to save listing:", err);
        }
    });

    
    client.on("messageUpdate", async (_, newMsg) => {
        if (!newMsg.guild || !newMsg.channel || !newMsg.author || !newMsg.content) return;

        const channelType = validChannels[newMsg.channel.id];
        if (!channelType) return;

        const entry = {
            userID: String(newMsg.author.id),
            username: newMsg.author.tag || "unknown",
            messageID: String(newMsg.id),
            content: newMsg.content.slice(0, 1000),
            channelType,
            channelName: newMsg.channel.name,
            channelID: String(newMsg.channel.id),
            timestamp: newMsg.createdTimestamp,
            messageLink: `https://discord.com/channels/${newMsg.guild.id}/${newMsg.channel.id}/${newMsg.id}`
        };

        try {
            db.prepare(`
                INSERT OR REPLACE INTO marks (userID, username, messageID, content, channelType, channelName, channelID, timestamp, messageLink)
                VALUES (@userID, @username, @messageID, @content, @channelType, @channelName, @channelID, @timestamp, @messageLink)
            `).run(entry);

            console.log(`[EDIT] Updated listing from ${entry.username} in #${entry.channelName}`);
        } catch (err) {
            console.error("[ERROR] Failed to update listing:", err);
        }
    });

    
    client.on("messageDelete", async (message) => {
        if (!message.guild || !message.channel || !message.id) return;

        const channelType = validChannels[message.channel.id];
        if (!channelType) return;

        try {
            db.prepare(`DELETE FROM marks WHERE messageID = ?`).run(String(message.id));
            console.log(`[DELETE] Removed listing ${message.id} from #${message.channel.name}`);
        } catch (err) {
            console.error("[ERROR] Failed to delete listing:", err);
        }
    });
}

async function backfillListings(client, channelMap, options = {}) {
    const extractUserID = options.extractUserID || (() => "unknown");

    for (const [type, channelID] of Object.entries(channelMap)) {
        const channel = await client.channels.fetch(channelID).catch(() => null);
        if (!channel) {
            console.warn(`[WARN] Could not fetch channel ${channelID}`);
            continue;
        }

        const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
        if (!messages || messages.size === 0) continue;

        console.log(`[BACKFILL] Fetched ${messages.size} messages from #${channel.name}`);

        for (const msg of messages.values()) {
            if (!msg.content || !msg.author) continue;

            const entry = {
                userID: extractUserID(msg.content),
                username: msg.author.tag || "unknown",
                messageID: String(msg.id),
                content: msg.content.slice(0, 1000),
                channelType: type,
                channelName: msg.channel.name,
                channelID: String(msg.channel.id),
                timestamp: msg.createdTimestamp,
                messageLink: `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`
            };

            try {
                db.prepare(`
                    INSERT OR REPLACE INTO marks (userID, username, messageID, content, channelType, channelName, channelID, timestamp, messageLink)
                    VALUES (@userID, @username, @messageID, @content, @channelType, @channelName, @channelID, @timestamp, @messageLink)
                `).run(entry);
            } catch (err) {
                console.error("[ERROR] Failed to recache listing:", err);
            }
        }
    }

    console.log(`[BACKFILL] Completed recache of recent messages.`);
}

module.exports = {
    trackListings,
    backfillListings
};
