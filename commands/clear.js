const { loadTicketData, saveTicketData, deleteTicket } = require('../db/tickets');

async function removeInvalidChannels(client) {
    let ticketData = loadTicketData(); 
    let validTickets = [];

    for (const ticket of ticketData) {
        try {
            const channel = await client.channels.fetch(ticket.channelID); 

            if (!channel) {
                console.warn(`[WARNING] Channel ${ticket.channelID} is invalid or inaccessible, removing from database.`);
                deleteTicket(ticket.channelID);
            } else {
                validTickets.push(ticket); 
            }
        } catch (err) {
            console.error(`[ERROR] Error fetching channel ${ticket.channelID}:`, err);
            deleteTicket(ticket.channelID);
            console.warn(`[WARNING] Channel ${ticket.channelID} is invalid, removed from database.`);
        }
    }

    saveTicketData(validTickets);
}

module.exports = async function handleClearCommand(message, client, activeMessages) {
    if (message.content.trim() === ".clear") {
        if (activeMessages.has(message.id)) return;
        activeMessages.add(message.id);

        try {
            await message.delete().catch(() => {}); 
            console.log("[DEBUG] Deleted user command message.");

            const scanningMessage = await message.channel.send("# **Clearing invalid channels**").catch(() => {});
            console.log("[DEBUG] Sent 'Clearing invalid channels' message.");

            await removeInvalidChannels(client);

            await scanningMessage.edit(" <a:SA_catSquish:948670233118404649> **Invalid channels removed the Db**").catch(() => {});
            console.log("[DEBUG] Invalid channels cleared.");
        } catch (error) {
            console.error("[ERROR] Error while processing .clear command:", error);
            message.channel.send({ content: "There was an error processing the `.clear` command.", flags: 4096 }).catch(() => {});
        } finally {
            activeMessages.delete(message.id);
        }
    }
};
