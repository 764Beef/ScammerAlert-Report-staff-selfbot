const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/tickets.db');
const db = new Database(dbPath);


db.prepare(`
    CREATE TABLE IF NOT EXISTS tickets (
        channelID TEXT PRIMARY KEY,
        status TEXT,
        lastMessageTime INTEGER,
        lastUserID TEXT,
        replied BOOLEAN
    )
`).run();

function loadTicketData() {
    try {
        const tickets = db.prepare("SELECT * FROM tickets").all();
        console.log(`[DEBUG] Loaded ${tickets.length} tickets from DB.`);
        return tickets;
    } catch (err) {
        console.error("[ERROR] Failed to load ticket data:", err);
        return [];
    }
}

function saveTicketData(ticketData) {
    try {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO tickets 
            (channelID, status, lastMessageTime, lastUserID, replied) 
            VALUES (@channelID, @status, @lastMessageTime, @lastUserID, @replied)
        `);

        for (const ticket of ticketData) {
            if (!ticket.channelID || typeof ticket.channelID !== "string") {
                console.warn("[WARNING] Skipping ticket with invalid channelID:", ticket);
                continue;
            }

            const sanitized = {
                channelID: String(ticket.channelID),
                status: typeof ticket.status === "string" ? ticket.status : "Unknown",
                lastMessageTime: typeof ticket.lastMessageTime === "number" ? ticket.lastMessageTime : null,
                lastUserID: ticket.lastUserID ? String(ticket.lastUserID) : null,
                replied: ticket.replied ? 1 : 0 
            };

            stmt.run(sanitized);
            console.log(`[DEBUG] Saved ticket:`, sanitized);
        }
    } catch (err) {
        console.error("[ERROR] Failed to save ticket data:", err);
    }
}

function deleteTicket(channelID) {
    try {
        db.prepare("DELETE FROM tickets WHERE channelID = ?").run(channelID);
        console.log(`[DEBUG] Deleted ticket for channel ${channelID}`);
    } catch (err) {
        console.error(`[ERROR] Failed to delete ticket ${channelID}:`, err);
    }
}

function getTicket(channelID) {
    try {
        const ticket = db.prepare("SELECT * FROM tickets WHERE channelID = ?").get(channelID);
        console.log(`[DEBUG] Fetched ticket for channel ${channelID}:`, ticket);
        return ticket;
    } catch (err) {
        console.error(`[ERROR] Failed to get ticket ${channelID}:`, err);
        return null;
    }
}

module.exports = {
    loadTicketData,
    saveTicketData,
    deleteTicket,
    getTicket
};
