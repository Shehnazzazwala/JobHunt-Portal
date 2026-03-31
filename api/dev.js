/** 
 * 🛠️ LOCAL DEV WRAPPER
 * Run this with: node api/dev.js
 * This simulates a serverless environment for local testing.
 */
const express = require('express');
const handler = require('./generate.js');
const app = express();
const PORT = 5000;

app.use(express.json());

// Proxy all requests to your serverless handler
app.all('*', (req, res) => {
    handler(req, res);
});

app.listen(PORT, () => {
    console.log(`\n🚀 Local Dev Server running at http://localhost:${PORT}`);
    console.log(`🔗 Frontend will now correctly call your /api/generate function.\n`);
});
