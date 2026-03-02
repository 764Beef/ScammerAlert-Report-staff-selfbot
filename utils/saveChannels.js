const fs = require('fs');
const path = require('path');
const debounce = require('./debounce');

const channelsFile = path.join(__dirname, '../data/channels.json');

const saveChannels = debounce((channelsData) => {
    try {
        fs.writeFileSync(channelsFile, JSON.stringify(channelsData, null, 4));
    } catch (err) {
        console.error("Failed to write channels file:", err);
    }
}, 1000);

module.exports = {
    saveChannels,
    channelsFile
};
