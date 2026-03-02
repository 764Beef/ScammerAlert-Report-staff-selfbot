function parseTime(input) {
    const match = input.match(/(\d+)([smhd])/);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2];

    const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
    return value * multiplier;
}

module.exports = async function handleResponseCommands(message, client, processingMessages) {
    if (message.author.id !== client.user.id) return;
    if (processingMessages.has(message.id)) return;
    processingMessages.add(message.id);

    try {
        const content = message.content.trim();

        const responses = {
            ".fr": "Please fill out **the form** properly, so we may handle your report.\n> Ensure to use the __form template__ which is provided below:\n```Accused IDs:\nAccused Tags:\n\nVictim ID:\nVictim Tag:\n\nExplanation of the Situation:\n\nExplanation of Payment:\n\nProof of the Accusations:\n\nAny Additional Details:```",
            ".ex": "Please fill out the **Explanation of Payment** properly.\n> - It **__MUST__** include the following information:\n>   - Product  |  Price  |  Currency  |  Payment Method\n\n**__Examples__**\n1.  Explanation of Payment: **2x Nitro Boost Monthly for 5€ PayPal**\n2.  Explanation of Payment: **300x Email-Verified Tokens for $35 LTC**\n3.  Explanation of Payment: **$50 PayPal for $47.50 LTC (Exchange)**\n-#   Please make sure your **Explanation of Payment** follows the specified format above.",
            ".ids": "Please edit the __correct__ user IDs into your form. One *or more* of the IDs you pasted are **invalid**.\n> Without the correct IDs, this report cannot be processed, as we cannot *identify* who the user is.\n-# Don't know how to find user IDs? View [this article](https://dis.gd/FindMyID)!",
            ".au": "Please provide the following evidence:\n\n- **UNCROPPED** Screenshot of the **Order Completion** Email Invoice.\n  - There is usually 2 emails that are sent: the order creation and order completion. We require the __order completion__ email.\n- Autobuy Website Link\n- Proof the Autobuy belongs to the accused.\n- **UNCROPPED** Payment Proof from your Wallet / App.",
            ".cr": "Please send **UNCROPPED** screenshots of the following:\n\n1.   **ENTIRE** Deal Conversation (from start to finish)\n  - We accept Ticket Transcripts, however they must be uploaded as HTML files.\n  - Otherwise, send screenshots.\n2.   Full Payment Transaction(s)\n    - For Crypto Payments: \n        - Send *Proof of Payment from Wallet App*, along with the *Transaction ID*.\n    - For CashApp Payments:\n        - A screen-recording refreshing the app, and loading the payment information.\n\n**What is Uncropped?**\n> Uncropped means your entire screen is visible without any elements hidden.\n> \n\n**Can I use a Media Uploader?**\n> No. All images/media must be uploaded **DIRECTLY** onto the report ticket, nothing else.\n\n**Can I send a Video?**\n> No. We only accept **Screenshots**.",
            ".low": "**The Minimum Disputable Amount is __$1 USD__.**\n> Exceptions to this rule may include **users with Many <@706874685144432641> Vouches**, reports against **Staff Members**, or reports against users **Exit Scamming** or **scamming large amounts of people**.\n\n**This is Stated in** <#1010672333498880168>\n> We Recommend you Read the Policy so that You can Report Effectively for Next Time.\n\nThanks,\n- *ScammerAlert!*",
            ".cur": "**Reports MUST contain __Real-World Currency__ to be processed**\n\n- Please check our <#1010672333498880168>, we explain what is a __valid currency__.\n  - Gift-Cards, Bot-Currency (OwO), and In-Game Items __are not valid__.",
            ".en": "We only accept **English Evidence**!\n - We **will not** process reports containing non-English chat logs, as we are an **English** server.\n   - This is clearly stated in our policy: https://discord.com/channels/888721743601094678/1010672333498880168.\n\n  - Please ensure you read it *carefully* before opening a report against a user.\n - In rare cases, we have translated reports that are **high value** or where the accused has **many vouches**, but this does not apply here.",
            ".exid": "Ensure that your form includes the __field names__ as shown in the example below.\nA correct example can be viewed below:\n\n**Accused ID**: 706874685144432641\n**Accused Tags**: shiba\n\n**Victim ID**: 1162835784324370543\n**Victim Tags**: Beef",
            ".holds": " ## This report is currently on hold for Senior Review. This **can** take a while, so please remain patient.",
            ".holdm": " ## This report is currently on hold for Admin Review. This **can** take a while, so please remain patient.",
        };

        if (responses[content]) {
            await message.channel.send(responses[content]).catch(console.error);
            await message.delete().catch(console.error);
        }

        if (content.startsWith(".tm ")) {
            const args = content.split(" ")[1];
            if (!args || !/^\d+(m|h)$/.test(args)) {
                await message.channel.send(" **Invalid format!** Use `.tm <time>`, e.g., `.tm 10m` or `.tm 2h`.").catch(console.error);
                await message.delete().catch(console.error);
                return;
            }
            await message.channel.send(`=rn timer ${args}`).catch(console.error);
            await message.channel.send(`=rm ${args}`).catch(console.error);
            await message.delete().catch(console.error);
        }

    } catch (error) {
        console.error("Error processing command:", error);
    } finally {
        processingMessages.delete(message.id);
    }
};
