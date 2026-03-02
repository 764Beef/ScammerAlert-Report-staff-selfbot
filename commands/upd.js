const { backfillListings } = require("../listeners/trackListings");

module.exports = async function handleUpdCommand(message, args, client) {
    await message.delete().catch(() => {});

    const channelMap = {
        s: "888763420055318559",
        d: "888763420466364457"
    };

    
    const statusMessage = await message.channel.send({
        content: "<a:LOADING:854227913028403210> Updating listings",
        flags: 4096,
        allowedMentions: { parse: [] }
    }).catch(() => null);

    try {
        await backfillListings(client, channelMap, {
            extractUserID: content => {
                const match = content.match(/\d{17,19}/);
                return match ? match[0] : "unknown";
            }
        });

        
        if (statusMessage) {
            await statusMessage.edit({
                content: "<a:SA_heheGiggle:1406733544117768222> Listings updated.",
                flags: 4096,
                allowedMentions: { parse: [] }
            }).catch(() => {});
        }
    } catch (err) {
        console.error("[ERROR] Failed to run .upd command:", err);
        if (statusMessage) {
            await statusMessage.edit({
                content: "Failed to update listings.",
                flags: 4096,
                allowedMentions: { parse: [] }
            }).catch(() => {});
        }
    }
};
