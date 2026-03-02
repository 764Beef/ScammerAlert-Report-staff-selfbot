const { loadTicketData, saveTicketData } = require('../db/tickets');

module.exports = function trackTicketMessages(client) {
    client.on("messageCreate", (message) => {
        if (!message.guild || !message.channel || !message.author) return;

        const ticketCategories = [
            "888763401663316048",
            "894862606882439199",
            "1084121775983562792"
        ];

        const parentID = message.channel.parentId;


        if (message.author.id !== client.user.id) return;
        if (!parentID || !ticketCategories.includes(parentID)) return;

        let ticketData = loadTicketData();
        let ticket = ticketData.find(t => t.channelID === message.channel.id);

        if (!ticket) {
            ticket = {
                channelID: String(message.channel.id),
                status: "Awaiting Reply",
                lastMessageTime: message.createdTimestamp ?? null,
                lastUserID: String(message.author.id),
                replied: 0 
            };

            ticketData.push(ticket);
            saveTicketData(ticketData);
            console.log(`[DEBUG] New ticket added for channel ${message.channel.id}`);
        }
    });
};
