const fs = require('fs');
const path = require('path');
const tokenPath = path.join(__dirname, '../token.txt');

let token;
try {
    token = fs.readFileSync(tokenPath, 'utf8').trim();
    if (!token) throw new Error('Token file is empty.');
} catch (error) {
    console.error('Error: Unable to read token.txt file!', error);
    process.exit(1);
}

module.exports = token;
