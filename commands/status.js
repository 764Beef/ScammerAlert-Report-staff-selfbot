let lastHandledMessageID = null;

module.exports = async function handleStatusCommand(message) {
    if (message.id === lastHandledMessageID) return;
    lastHandledMessageID = message.id;

    const [command, userMention] = message.content.split(" ");
    if (!command || !userMention) return;

    const userID = userMention.replace(/[<@!>]/g, "");
    if (!/^\d{17,19}$/.test(userID)) return;

    try {
        let renameText = "";
        let muteTime = "";

        switch (command) {
            case ".d":
                renameText = "denied";
                muteTime = "2h";
                break;
            case ".a":
                renameText = "accepted";
                muteTime = "30m";
                break;
            case ".r":
                renameText = "resolved";
                muteTime = "45m";
                break;
            default:
                return;
        }

        await message.channel.send(`=rn ${userID} ${renameText}`);
        await message.channel.send(`=rm ${muteTime}`);

        setTimeout(async () => {
            if (message.deletable) {
                await message.delete().catch(() => {});
            }
        }, 150);
    } catch (error) {
        console.error(`Error handling ${command} command:`, error);
    }
};
