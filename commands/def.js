module.exports = async function handleDefCommand(message) {
    if (!message.content.startsWith(".def ")) return;

    const args = message.content.split(" ");
    if (args.length !== 2) return;

    const userID = args[1].replace(/[<@!>]/g, "");

    if (!/^\d{17,19}$/.test(userID)) return;

    if (message.__processed) return;
    message.__processed = true;

    try {
        await message.channel.send(`Hello <@${userID}>,\nYou have 13 hours to defend yourself - read above. Failure to do so will result in you getting marked and listed as a Scammer / DWC.`);
        await message.channel.send(`=rm 13h`);
        setTimeout(async () => {
            if (message.deletable) {
                await message.delete().catch(() => {});
            }
        }, 150);
    } catch (error) {
        console.error("Error handling .def command:", error);
    }
};
