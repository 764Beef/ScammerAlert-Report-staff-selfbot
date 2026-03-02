module.exports = async function handleHelpCommand(message) {
    const helpText = `
# <a:SA_headbang:957672018646564924> Commands

**<a:ticketsa:1405120683633278997> Ticket Management**
- \`.lt\` — List tickets you're handling
- \`.ls <userID>\` — Find listings for a specific user
- \`.clear\` — Remove invalid or closed tickets
- \`.re <channelID>\` — Remove a specific ticket from the database
- \`.unc\` — Show tickets with no staff response
- \`.inactive <time>\` — Show tickets inactive for a given time (e.g. \`1d\`, \`2h\`)

**<a:staffsa:1358876490263040293> Notifiers**
- \`.dm <userID>\` — DM a user about an open report
- \`.def <userID>\` — Remind a user to defend themselves
- \`.d <userID>\` — Mark report as denied
- \`.a <userID>\` — Mark report as accepted
- \`.r <userID>\` — Mark report as resolved

**<a:leaderboardsa:1370912436106035260> Leaderboard & Reports**
- \`.lb\` — Show leaderboard for current month
- \`.lb <DD MM YYYY>\` — Show leaderboard from a specific date
- \`.calb\` — recache last 50 messages to update the leaderboard 
- \`.pc\` — Fix any issues in misscounting leaderboard entries
- \`.cleanlb\` — Remove duplicate entries from the leaderboard database

**<a:leaderboardsa:1370912436106035260> Form Examples**
- \`.fr\` — Report form template
- \`.ex\` — Explanation of payment format
- \`.ids\` — Reminder to use correct user IDs
- \`.au\` — Autobuy report requirements
- \`.cr\` — Conversation and payment proof guidelines
- \`.low\` — Minimum disputable amount
- \`.cur\` — Valid currencies
- \`.en\` — English evidence requirement
- \`.exid\` — Example of correct ID formatting
- \`.holds\` — Mark report as on hold for senior review
- \`.holdm\` — Mark report as on hold for admin review

**<:emoji_23:1051594054456053790> Utilities**
- \`.tm <time>\` — Set a timer (e.g. \`.tm 10m\`, \`.tm 2h\`)
- \`.help\` — Show this help message
`;

    await message.channel.send(helpText).catch(console.error);
    await message.delete().catch(() => {});
};
