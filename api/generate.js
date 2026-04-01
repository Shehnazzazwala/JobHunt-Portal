const https = require('https');

module.exports = async (req, res) => {
    // 🛡️ CORS Headers (Allow browser access)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle Preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 🛡️ Only allow POST
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    // Accumulate request body
    let body = '';
    req.on('data', chunk => { body += chunk; });

    req.on('end', async () => {
        try {
            const data = JSON.parse(body);
            const { name, title, skills, experience, goals, systemPrompt } = data;
            const apiKey = process.env.OPENAI_API_KEY;

            if (!apiKey) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'OpenAI API Key not configured on Vercel Dashboard.' }));
                return;
            }

            // OpenAI API Request Data
            const openaiData = JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Name: ${name}. Title: ${title}. Skills: ${skills}. Experience: ${experience}. Summary goals: ${goals}.` }
                ]
            });

            // 🚀 Native HTTPS Request
            const options = {
                hostname: 'api.openai.com',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(openaiData)
                }
            };

            const openaiReq = https.request(options, (openaiRes) => {
                let responseBody = '';
                openaiRes.on('data', (d) => { responseBody += d; });
                openaiRes.on('end', () => {
                    res.writeHead(openaiRes.statusCode, { 'Content-Type': 'application/json' });
                    res.end(responseBody);
                });
            });

            openaiReq.on('error', (e) => {
                console.error("OpenAI Request Error:", e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to connect to OpenAI' }));
            });

            openaiReq.write(openaiData);
            openaiReq.end();

        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid Request Body' }));
        }
    });
};
