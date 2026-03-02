const LOG_CHANNEL_ID = "888763435196747776";

module.exports = async function handleUsCommand(message, client) {
    try {
        await message.delete().catch(() => {});
        console.log("[US] Deleted command message.");

        const repliedMessageID = message.reference?.messageId;
        const repliedChannelID = message.reference?.channelId;

        if (!repliedMessageID || !repliedChannelID) {
            console.warn("[US] No valid replied message reference.");
            return;
        }

        const repliedChannel = client.channels.cache.get(repliedChannelID);
        const repliedMessage = repliedChannel?.messages?.cache?.get(repliedMessageID);

        if (!repliedMessage || !repliedMessage.content) {
            console.warn("[US] Replied message not found in cache.");
            return;
        }

        const content = repliedMessage.content;
        console.log(`[US] Replied message content:\n${content}`);

        const idMatches = [...content.matchAll(/\b\d{17,19}\b/g)].map(m => m[0]);

        if (idMatches.length === 0) {
            console.warn("[US] No valid user IDs found in replied message.");
            return;
        }

        const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) {
            console.error("[US] Log channel not found.");
            return;
        }

        for (const id of idMatches) {
            await logChannel.send(`-p ${id}`).catch(() => {});
            console.log(`[US] Sent -p ${id}`);
            await new Promise(resolve => setTimeout(resolve, 2000));

            await logChannel.send(`=ui ${id}`).catch(() => {});
            console.log(`[US] Sent =ui ${id}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log("[US] All commands sent.");
    } catch (err) {
        console.error("[US] Error processing .us command:", err);
    }
};
