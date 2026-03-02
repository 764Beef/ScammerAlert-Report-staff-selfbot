# Installation Guide

This guide walks you through installing and running **ScammerAlert Report Staff selfbot** locally.

---

## 📋 Requirements

Ensure the following are installed:

- **Node.js** v18 or higher  
- **npm** (comes with Node.js)  
- SQLite support (handled automatically via dependencies)

You can verify Node.js installation:

```bash
node -v
npm -v
```

---

## 📦 Clone the Repository

```bash
git clone https://github.com/764Beef/ScammerAlert-Report-Staff-selfbot.git
cd ScammerAlert-Report-Staff-selfbot
```

---

## 📥 Install Dependencies

Install required packages:

```bash
npm install
```

This will install all required dependencies defined in `package.json`, including:

- `discord.js`
- `discord.js-selfbot-v13`
- `better-sqlite3`
- `sqlite3`
- `quick.db`
- `dotenv`
- `lodash`
- `moment`
- `moment-timezone`
- `pm2`

---


## ▶️ Running the Application

### Standard Run

```bash
npm start
```

If no start script exists:

```bash
node ScammerAlert-Report-staff-selfbot/reports.js
```

## 🟢 Running with PM2

PM2 is included as a dependency and allows process management.

Install globally:

```bash
npm install -g pm2
```

Start the application:

```bash
cd ScammerAlert-Report-staff-selfbot
pm2 start ScammerAlert-Report-staff-selfbot/reports.js --name scammer-alert
```

View logs:

```bash
pm2 logs scammer-alert
```

Restart:

```bash
pm2 restart scammer-alert
```

Stop:

```bash
pm2 stop scammer-alert
```

---

## 🗄 Database Initialization

The project uses SQLite for persistence.

If the database file does not exist, it will be created automatically on first run.

Ensure the `/data` directory exists:

```bash
mkdir data
```

---

## 🛠 Troubleshooting

### Dependency Build Errors

If `better-sqlite3` fails to build:

- Ensure you have a compatible Node.js version (v18+ recommended)
- On Windows, install Windows Build Tools
- On Linux, install build-essential

---

## 🔄 Updating Dependencies

```bash
npm update
```

To reinstall from scratch:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Thank you for installing!
