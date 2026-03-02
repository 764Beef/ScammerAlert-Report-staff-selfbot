const fs = require("fs");
const path = require("path");
const { Client } = require("discord.js-selfbot-v13");
const client = new Client();

const tokenPath = "./token.txt";
let token;
try {
    token = fs.readFileSync(tokenPath, 'utf8').trim();
    if (!token) throw new Error('Token file is empty.');
} catch (error) {
    console.error('Error: Unable to read token.txt file!', error);
    process.exit(1);
}

const SERVER_ID = "888721743601094678";
const MODERATOR_ROLE_ID = "888763390246391869";
const LOG_CHANNEL_ID = "1355705415588909217";

client.setMaxListeners(75);


client.login(token).then(async () => {
    console.log(`[BOT] Logged in as ${client.user.tag}`);

    
    setTimeout(() => {
        client.user.setPresence({ status: 'dnd' });
        console.log("[STATUS] DND presence applied.");
    }, 1500);

    
    const onReady = require('./listeners/ready');
    await onReady(client, SERVER_ID, MODERATOR_ROLE_ID);

    const { reportTranscripts } = require("./listeners/reportTranscripts");
    await reportTranscripts(client);

    
    const activeMessages = new Set();
    const processingMessages = new Set();

    const handleLtCommand = require('./commands/lt');
    const handleClearCommand = require('./commands/clear');
    const handleReCommand = require('./commands/re');
    const handleUncCommand = require('./commands/unc');
    const handleDmCommand = require('./commands/dm');
    const handleDefCommand = require('./commands/def');
    const handleInactiveCommand = require('./commands/inactive');
    const handleStatusCommand = require('./commands/status');
    const handleResponseCommands = require('./commands/respond');
    const handleHelpCommand = require('./commands/help');
    const handleLsCommand = require('./commands/ls');
    const handleUsCommand = require('./commands/us');
    const handleUpdCommand = require('./commands/upd');
    const handleLbCommand = require('./commands/lb');
    const handleRElbCommand = require('./commands/calb');
    const handleRepachCommand = require('./commands/pc');
    const handleCleanDupeCommand = require('./commands/cleanlb');

    const trackTicketMessages = require('./listeners/trackTickets');
    const { trackListings } = require('./listeners/trackListings');
    const onChannelCreate = require('./listeners/channelCreate');
    const onChannelDelete = require('./listeners/channelDelete');
    const onChannelUpdate = require('./listeners/channelUpdate');
    const liveReportListener = require("./listeners/liveReports");

    
    client.on('channelCreate', (channel) => onChannelCreate(channel, client, SERVER_ID, MODERATOR_ROLE_ID));
    client.on('channelDelete', (channel) => onChannelDelete(channel, client, SERVER_ID, MODERATOR_ROLE_ID));
    client.on('channelUpdate', (oldChannel, newChannel) => onChannelUpdate(oldChannel, newChannel, client, SERVER_ID, MODERATOR_ROLE_ID));

    
    trackTicketMessages(client);
    trackListings(client);
    liveReportListener(client);

   
    client.on('messageCreate', async (message) => {
        if (message.author.id !== client.user.id) return;
        if (processingMessages.has(message.id)) return;
        processingMessages.add(message.id);

        if (!message.channel || !message.author || !message.content) return;
        const content = message.content.trim();

        try {
            if (content === ".lt") {
                await handleLtCommand(message, client, activeMessages);
            } else if (content === ".clear") {
                await handleClearCommand(message, client, activeMessages);
            } else if (content.startsWith(".re ")) {
                await handleReCommand(message, activeMessages);
            } else if (content === ".unc") {
                await handleUncCommand(message, client, activeMessages, SERVER_ID);
            } else if (content.startsWith(".dm")) {
                await handleDmCommand(message, client, activeMessages);
            } else if (content.startsWith(".inactive")) {
                await handleInactiveCommand(message, client, SERVER_ID);
            } else if (content.startsWith(".def ")) {
                await handleDefCommand(message);
            } else if ([".d", ".a", ".r"].some(cmd => content.startsWith(cmd))) {
                await handleStatusCommand(message);
            } else if (content === ".help") {
                await handleHelpCommand(message);
            } else if (content === ".us") {
                await handleUsCommand(message, client, LOG_CHANNEL_ID);
            } else if (content.startsWith(".ls ")) {
                const args = content.slice(4).trim().split(/\s+/);
                await handleLsCommand(message, args);
            } else if (content === ".upd") {
                await handleUpdCommand(message, [], client);
            } else if (content.startsWith(".lb")) {
                const args = content.slice(3).trim().split(/\s+/);
                await handleLbCommand(message, args);
            } else if (content === ".calb") {
                await handleRElbCommand(message, [], client);        
            } else if (content === ".pc") {
                await handleRepachCommand(message);
            } else if (content === ".cleanlb") {
                await handleCleanDupeCommand(message);
            } else {
                await handleResponseCommands(message, client, activeMessages);
            }
        } catch (err) {
            console.error("Error in messageCreate handler:", err);
        } finally {
            processingMessages.delete(message.id);
        }
    });
}).catch((error) => {
    console.error("Login failed:", error.message);
});
