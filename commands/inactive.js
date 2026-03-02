function snowflakeToDate(snowflake) {
    const DISCORD_EPOCH = 1420070400000;
    const timestamp = BigInt(snowflake) >> 22n;
    return new Date(Number(timestamp) + DISCORD_EPOCH);
}

function parseTime(timeStr) {
    const timePattern = /^(\d+)([smhd])$/;
    const match = timeStr.match(timePattern);

    if (!match) return null;

    const amount = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's': return amount;
        case 'm': return amount * 60;
        case 'h': return amount * 3600;
        case 'd': return amount * 86400;
        default: return null;
    }
}

async function sendLongMessage(channel, messageLines) {
    const maxMessageLength = 2000;
    let currentMessage = '';

    for (let line of messageLines) {
        if ((currentMessage + line).length > maxMessageLength) {
            await channel.send(currentMessage);
            currentMessage = line;
        } else {
            currentMessage += line + '\n';
        }
    }

    if (currentMessage.length > 0) {
        await channel.send(currentMessage);
    }
}

module.exports = async function handleInactiveCommand(message, client, SERVER_ID) {
    if (message.content.startsWith('.inactive')) {
        if (message.processing) return;
        message.processing = true;

        await message.delete().catch(() => {});

        const args = message.content.split(' ').slice(1);
        if (args.length < 1) {
            message.processing = false;
            return message.channel.send('Usage: `.inactive <time>`');
        }

        const time = args[0];
        const timeThreshold = parseTime(time);
        if (!timeThreshold) {
            message.processing = false;
            return message.channel.send('Invalid time format. Please use a valid format like "1d", "2h", etc.');
        }

        let responseLines = [`**Inactive Tickets (${time} or longer):**\n`];

        const categoryIDs = ["888763401663316048", "894862606882439199"];
        const guild = client.guilds.cache.get(SERVER_ID);
        if (!guild) {
            message.processing = false;
            return message.channel.send('Guild not found.');
        }

        let allChannels = [];
        try {
            const fetchedChannels = await guild.channels.fetch();
            allChannels = fetchedChannels.filter(channel =>
                categoryIDs.includes(channel.parentId) && channel.type === "GUILD_TEXT"
            );
        } catch (error) {
            console.error(`Error fetching categories:`, error);
            message.processing = false;
            return message.channel.send('Error fetching ticket channels.');
        }

        console.log(`Fetched ${allChannels.size} channels from the categories.`);

        if (allChannels.size === 0) {
            message.processing = false;
            return message.channel.send('No channels found in the specified categories.');
        }

        let inactiveChannels = [];
        for (const channel of allChannels.values()) {
            const lastMessageID = channel.lastMessageId;
            if (!lastMessageID) {
                console.log(`Channel ${channel.id} has no last message.`);
                continue;
            }

            try {
                const lastMessageTimestamp = snowflakeToDate(lastMessageID).getTime();
                const diffTime = (Date.now() - lastMessageTimestamp) / 1000;
                console.log(`Channel ${channel.id} last message was ${diffTime} seconds ago.`);
                if (diffTime >= timeThreshold) {
                    inactiveChannels.push(channel);
                }
            } catch (error) {
                console.error(`Error processing last message for channel ${channel.id}:`, error);
            }
        }

        console.log(`Found ${inactiveChannels.length} inactive channels matching the threshold.`);

        if (inactiveChannels.length === 0) {
            message.processing = false;
            return message.channel.send('No inactive tickets found for the specified time.');
        }

        for (const channel of inactiveChannels) {
            const lastMessageID = channel.lastMessageId;
            let status = "";
            try {
                const lastMessage = channel.messages.cache.get(lastMessageID) || await channel.messages.fetch(lastMessageID);
                if (!lastMessage) {
                    status = "Unknown";
                } else {
                    const member = await guild.members.fetch(lastMessage.author.id).catch(() => null);
                    if (member && member.roles.cache.has("888763380888895499")) {
                        status = "Awaiting Ticket Owner's Response";
                    } else {
                        status = "Requires Staff Reply";
                    }
                }
            } catch (err) {
                console.error(`Error fetching last message for channel ${channel.id}:`, err);
                status = "Error";
            }
            responseLines.push(`- <#${channel.id}> - ${status}`);
        }

        console.log(`Sending ${responseLines.length} lines of response.`);
        await sendLongMessage(message.channel, responseLines);

        message.processing = false;
    }
};
