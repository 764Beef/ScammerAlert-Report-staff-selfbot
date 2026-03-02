const { loadTicketData, saveTicketData } = require('../db/tickets');

module.exports = async function handleLtCommand(message, client, activeMessages) {
    if (activeMessages.has(message.id)) return;
    activeMessages.add(message.id);

    try {
        await message.delete().catch(() => {});
        console.log("[DEBUG] Deleted user command message.");

        const scanningMessage = await message.channel.send("# <a:loadingsa:1356740951590174920> **Retrieving Ticket Data**").catch(() => {});
        console.log("[DEBUG] Sent 'Retrieving Ticket Data' message.");

        let ticketData = loadTicketData();
        if (!ticketData || ticketData.length === 0) {
            console.warn("[WARNING] No ticket data found!");
            await scanningMessage.edit("# **No ticket data available!**").catch(() => {});
            return;
        }

        console.log(`[DEBUG] Loaded ${ticketData.length} tickets from database.`);
        let updatedTickets = [];

        for (const ticket of ticketData) {
            if (!ticket.channelID) {
                console.warn("[WARNING] Ticket missing channel ID:", ticket);
                continue;
            }

            let channel;
            try {
                channel = await client.channels.fetch(ticket.channelID);
            } catch (err) {
                console.error(`[ERROR] Failed to fetch channel ${ticket.channelID}:`, err);
                ticket.status = 'No Access';
                ticket.lastMessageTime = null;
                ticket.lastUserID = null;
                ticket.replied = false;
                updatedTickets.push(ticket);
                continue;
            }

            try {
                const messages = await channel.messages.fetch({ limit: 1 }).catch(() => null);
                const lastMessage = messages?.first();

                if (!lastMessage) {
                    ticket.status = 'No Messages';
                    ticket.lastMessageTime = null;
                    ticket.lastUserID = null;
                    ticket.replied = false;
                } else {
                    ticket.lastMessageTime = typeof lastMessage.createdTimestamp === "number"
                        ? lastMessage.createdTimestamp
                        : null;

                    ticket.lastUserID = lastMessage.author?.id
                        ? String(lastMessage.author.id)
                        : null;

                    if (ticket.lastUserID === client.user.id) {
                        ticket.status = 'Awaiting Reply';
                        ticket.replied = false;
                    } else {
                        ticket.status = 'Require Reply';
                        ticket.replied = true;
                    }

                    console.log(`[DEBUG] Last message in ${ticket.channelID} by ${ticket.lastUserID}`);
                }
            } catch (err) {
                console.error(`[ERROR] Error fetching messages in channel ${ticket.channelID}:`, err);
                ticket.status = 'No Access';
                ticket.lastMessageTime = null;
                ticket.lastUserID = null;
                ticket.replied = false;
            }

            updatedTickets.push(ticket);
        }

        saveTicketData(updatedTickets);
        console.log(`[DEBUG] Updated ${updatedTickets.length} ticket statuses.`);

        ticketData = loadTicketData();

        const replyIcons = {
            false: ` <a:Red_Cross:878213608797007903>`,
            true: ` <a:Green_Tick:878213552396193832>`
        };

        let firstMessage = `# <a:staffsa:1358876490263040293>  **TICKET LIST**\n\n`;
        firstMessage += `# **Total Tickets:** ${ticketData.length}\n\n\u200b\n`;

        let messagesToSend = [];
        let currentMessage = firstMessage;

        for (const [index, ticket] of ticketData.entries()) {
            let channelMention = `<#${ticket.channelID}>`;
            let lastMessageTime = ticket.lastMessageTime ? `<t:${Math.floor(ticket.lastMessageTime / 1000)}:R>` : "Unknown";
            let lastUserMention = ticket.lastUserID ? `<@!${ticket.lastUserID}>` : "Unknown";
            let replyStatus = replyIcons[ticket.replied ? true : false];

            let channelName = "unknown-channel";
            try {
                const channel = await client.channels.fetch(ticket.channelID).catch(() => null);
                channelName = channel?.name || "unknown-channel";
            } catch (error) {
                console.warn(`[WARNING] Failed to fetch channel name for ${ticket.channelID}`);
            }

            let timeMatch = channelName.match(/(\d+)(h|m)/);
            let timeframe = timeMatch ? `${timeMatch[1]} ${timeMatch[2] === 'h' ? 'hours' : 'minutes'}` : null;

            let statusMatch = channelName.match(/\b(Accepted|Denied|Hold)\b/i);
            let status = statusMatch ? statusMatch[1] : "Pending";

            let ticketEntry = `**${index + 1}.** ${channelMention}\n`;
            ticketEntry += ` **Last Message:** ${lastMessageTime} by ${lastUserMention}\n`;
            if (timeframe) ticketEntry += ` **Timeframe:** ${timeframe}\n`;
            ticketEntry += ` **Status:** ${status}\n`;
            ticketEntry += ` **Replied:** ${replyStatus}\n\n\u200b\n`;

            if (currentMessage.length + ticketEntry.length > 2000) {
                messagesToSend.push(currentMessage);
                currentMessage = ticketEntry;
            } else {
                currentMessage += ticketEntry;
            }
        }

        if (currentMessage.length > 0) messagesToSend.push(currentMessage);

        console.log(`[DEBUG] Preparing to send ${messagesToSend.length} messages.`);

        await scanningMessage.delete().catch(() => {});
        console.log("[DEBUG] Deleted 'Retrieving Ticket Data' message.");

        for (const part of messagesToSend) {
            await message.channel.send({
                content: part,
                flags: 4096,
                allowedMentions: { parse: [] }
            }).catch(() => {});
        }

        console.log("[DEBUG] All messages sent successfully.");
    } catch (error) {
        console.error("[ERROR] Error while processing .lt command:", error);
        message.channel.send({ content: "There was an error processing the `.lt` command.", flags: 4096 }).catch(() => {});
    } finally {
        activeMessages.delete(message.id);
    }
};
