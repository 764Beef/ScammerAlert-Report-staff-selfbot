const { getTicket, deleteTicket } = require('../db/tickets');

module.exports = async function handleReCommand(message, activeMessages) {
    if (message.content.trim().startsWith(".re ")) {
        if (activeMessages.has(message.id)) return;
        activeMessages.add(message.id);

        try {
            await message.delete().catch(() => {});
            console.log("[DEBUG] Deleted user command message.");

            const args = message.content.trim().split(" ");
            const channelID = args[1];

            if (!channelID) {
                await message.channel.send("##  **Please provide a channel ID to remove.**").catch(() => {});
                return;
            }

            const info = getTicket(channelID);

            if (!info) {
                await message.channel.send(`## **Channel ID \`${channelID}\` not found in the DB.**`).catch(() => {});
                return;
            }

            deleteTicket(channelID);
            await message.channel.send(`##  **Channel ID \`${channelID}\` removed from the DB.**`).catch(() => {});
            console.log(`[DEBUG] Removed ticket with channelID ${channelID} from DB.`);
        } catch (error) {
            console.error("[ERROR] Error while processing .re command:", error);
            message.channel.send({ content: "There was an error processing the `.re` command.", flags: 4096 }).catch(() => {});
        } finally {
            activeMessages.delete(message.id);
        }
    }
};
