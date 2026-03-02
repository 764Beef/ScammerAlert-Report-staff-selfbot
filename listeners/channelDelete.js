const fs = require('fs');
const { saveChannels, channelsFile } = require('../utils/saveChannels');

module.exports = function onChannelDelete(channel, client, SERVER_ID, MODERATOR_ROLE_ID) {
    if (!channel?.guild || !channel.id || channel.guild.id !== SERVER_ID) return;

    const botMember = channel.guild.members.cache.get(client.user.id);
    if (!botMember?.roles?.cache?.has(MODERATOR_ROLE_ID)) return;

    try {
        const channelsData = JSON.parse(fs.readFileSync(channelsFile, 'utf8'));
        delete channelsData[channel.id];
        saveChannels(channelsData);
        console.log(`Channel deleted: ${channel.name}`);
    } catch (err) {
        console.error("Error handling channelDelete:", err);
    }
};
