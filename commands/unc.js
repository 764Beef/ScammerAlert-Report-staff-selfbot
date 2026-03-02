const fs = require('fs');
const { channelsFile } = require('../utils/saveChannels');

module.exports = async function handleUncCommand(message, client, processingMessages, SERVER_ID) {
    if (message.content.trim() !== ".unc") return;
    if (processingMessages.has(message.id)) return;
    processingMessages.add(message.id);

    try {
        await message.delete().catch(err => {
            if (err.code !== 10008) console.error("Failed to delete trigger:", err);
        });

        const guild = client.guilds.cache.get(SERVER_ID);
        if (!guild) return message.channel.send("Guild not found.").catch(console.error);

        const categoryIDs = ["888763401663316048", "894862606882439199"];
        const staffRoleID = "888763380888895499";
        let noStaffResponseTickets = [];

        const channelsData = JSON.parse(fs.readFileSync(channelsFile, "utf8"));

        const isValidReportChannel = (channelName) => /^report-\d+$/.test(channelName);

        for (const [channelID, data] of Object.entries(channelsData)) {
            const channel = guild.channels.cache.get(channelID);
            if (!channel || !categoryIDs.includes(channel.parentId) || !isValidReportChannel(data.name)) {
                continue;
            }

            try {
                const messages = await channel.messages.fetch({ limit: 50 }).catch(() => []);
                if (messages.size === 0) {
                    noStaffResponseTickets.push(`<#${channel.id}>`);
                    continue;
                }

                let staffMessageFound = false;
                for (const msg of messages.values()) {
                    let member = msg.member || await guild.members.fetch(msg.author.id).catch(() => null);
                    if (member && member.roles.cache.has(staffRoleID)) {
                        staffMessageFound = true;
                        break;
                    }
                }

                if (!staffMessageFound) {
                    noStaffResponseTickets.push(`<#${channel.id}>`);
                } else {
                    delete channelsData[channelID];
                    fs.writeFileSync(channelsFile, JSON.stringify(channelsData, null, 4));
                }
            } catch (error) {
                console.error(`Error processing channel ${channelID}:`, error);
            }
        }

        if (noStaffResponseTickets.length === 0) {
            return message.channel.send(" **All tickets have received staff responses.**").catch(console.error);
        }

        const header = `### <a:SA_CH_IconLoading:1290355454962176053> **Unclaimed Reports** <a:SA_CH_IconLoading:1290355454962176053>\n\nThe following tickets have **not** received a response from staff:\n`;
        const maxChars = 4000;
        let messageChunks = [header];

        for (const ticket of noStaffResponseTickets) {
            if (messageChunks[messageChunks.length - 1].length + ticket.length + 1 > maxChars) {
                messageChunks.push(ticket + "\n");
            } else {
                messageChunks[messageChunks.length - 1] += ticket + "\n";
            }
        }

        for (const chunk of messageChunks) {
            await message.channel.send(chunk).catch(console.error);
        }
    } catch (error) {
        console.error("Error handling .unc command:", error);
    } finally {
        processingMessages.delete(message.id);
    }
};
