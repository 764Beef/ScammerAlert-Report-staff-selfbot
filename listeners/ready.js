const { saveChannels } = require('../utils/saveChannels');
const { backfillListings } = require('../listeners/trackListings');

module.exports = async function onReady(client, SERVER_ID, MODERATOR_ROLE_ID) {
    const guild = client.guilds.cache.get(SERVER_ID);
    if (!guild) return console.error("Guild not found.");

    const botMember = guild.members.cache.get(client.user.id);
    if (!botMember?.roles?.cache?.has(MODERATOR_ROLE_ID)) {
        console.log("Missing required moderator role. Shutting down.");
        client.destroy();
        return;
    }

    try {
        const categoryIDs = ["888763401663316048", "894862606882439199"];
        const channelsData = {};

        guild.channels.cache.forEach((channel) => {
            if (channel?.type === "GUILD_TEXT" && categoryIDs.includes(channel.parentId)) {
                channelsData[channel.id] = {
                    name: channel.name,
                    unclaimed: true,
                };
            }
        });

        saveChannels(channelsData);
        console.log("Channels loaded and saved.");
    } catch (error) {
        console.error("Error loading channels:", error);
    }

    const ENABLE_BACKFILL = false;

    if (ENABLE_BACKFILL) {
        const CHANNELS = {
            s: "888763420055318559",
            d: "888763420466364457"
        };

        try {
            await backfillListings(client, CHANNELS, {
                extractUserID: (content) => {
                    const match = content.match(/\b\d{17,19}\b/);
                    return match ? match[0] : "unknown";
                }
            });
            console.log("[BACKFILL] All historical listings have been fetched.");
        } catch (err) {
            console.error("[BACKFILL] Failed to fetch listings:", err);
        }
    } else {
        console.log("[BACKFILL] Skipped — toggle is disabled.");
    }
};
