module.exports = async function handleDmCommand(message, client, processingMessages) {
    if (message.content.startsWith('.dm')) {
        const args = message.content.split(' ').slice(1);
        if (args.length < 1) {
            processingMessages.delete(message.id);
            return message.channel.send('Usage: .dm <userID>');
        }

        const userID = args[0];

        try {
            const user = await client.users.fetch(userID);

            const dmMessage = `**Hello <@${userID}>,
you have an open report against yourself in ScammerAlert. We believe there is a second side to each dispute.
Please join the server to provide your side of the dispute within 13 hours!
Failure to join and defend yourself may result in you being listed as Scammer or DWC. discord.gg/scammeralert **

**Ticket:** <#${message.channel.id}>`;

            await user.send(dmMessage);
            await message.delete();

            await message.channel.send('=rn timer 13h');
            await message.channel.send(`=rm 13h <#${message.channel.id}> join`);
        } catch (error) {
            console.error('Error fetching user or sending DM:', error);
            message.channel.send('Could not fetch the user or send DM. Ensure the user ID is valid and that DMs are enabled.');
        }

        processingMessages.delete(message.id);
    }
}
