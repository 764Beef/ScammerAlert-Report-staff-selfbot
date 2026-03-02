const fs = require('fs');
const { saveChannels, channelsFile } = require('../utils/saveChannels');

module.exports = function onChannelCreate(channel, client, SERVER_ID, MODERATOR_ROLE_ID) {
    if (!channel?.guild || !channel.id || channel.type !== 'GUILD_TEXT') return;
    if (channel.guild.id !== SERVER_ID) return;

    const botMember = channel.guild.members.cache.get(client.user.id);
    if (!botMember?.roles?.cache?.has(MODERATOR_ROLE_ID)) return;

    try {
        const channelsData = JSON.parse(fs.readFileSync(channelsFile, 'utf8'));
        channelsData[channel.id] = {
            name: channel.name,
            unclaimed: true,
        };
        saveChannels(channelsData);
        console.log(`Channel created: ${channel.name}`);
    } catch (err) {
        console.error("Error handling channelCreate:", err);
    }
};
