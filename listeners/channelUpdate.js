const fs = require('fs');
const { saveChannels, channelsFile } = require('../utils/saveChannels');

module.exports = function onChannelUpdate(oldChannel, newChannel, client, SERVER_ID, MODERATOR_ROLE_ID) {
    if (!oldChannel?.guild || !oldChannel.id || oldChannel.type !== 'GUILD_TEXT') return;
    if (oldChannel.guild.id !== SERVER_ID) return;

    const botMember = oldChannel.guild.members.cache.get(client.user.id);
    if (!botMember?.roles?.cache?.has(MODERATOR_ROLE_ID)) return;

    try {
        const channelsData = JSON.parse(fs.readFileSync(channelsFile, 'utf8'));
        if (channelsData[oldChannel.id]) {
            channelsData[oldChannel.id].name = newChannel.name;
            saveChannels(channelsData);
            console.log(`Channel renamed: ${oldChannel.name} -> ${newChannel.name}`);
        }
    } catch (err) {
        console.error("Error handling channelUpdate:", err);
    }
};
