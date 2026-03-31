/** 
 * 🛠️ LOCAL DEV WRAPPER (Pure Node.js)
 * Run this with: node api/dev.js
 * NO npm install required!
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const handler = require('./generate.js');

// 🛡️ Simple .env loader (Self-made to avoid 'dotenv' dependency)
try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    }
} catch (e) {
    console.warn("⚠️  Could not load .env file locally.");
}

const server = http.createServer((req, res) => {
    // Route everything to the handler
    handler(req, res);
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Zero-Dependency Dev Server running at http://localhost:${PORT}`);
    console.log(`🔗 No node_modules or npm install needed. Just pure magic.\n`);
});
