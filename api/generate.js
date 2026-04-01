const https = require('https');

module.exports = async (req, res) => {
    // 🛡️ CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });

    req.on('end', async () => {
        try {
            const data = JSON.parse(body);
            const { name, title, skills, experience, goals, systemPrompt } = data;

            // 🔐 Support both OpenAI and Gemini keys (Priority to Gemini for Free Tier)
            const geminiKey = process.env.GEMINI_API_KEY;
            const openaiKey = process.env.OPENAI_API_KEY;

            if (geminiKey) {
                // 🚀 USE GOOGLE GEMINI (Truly Free)
                const prompt = `${systemPrompt}\n\nUser Profile:\nName: ${name}\nTitle: ${title}\nSkills: ${skills}\nExperience: ${experience}\nGoals: ${goals}`;

                const geminiData = JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { response_mime_type: "application/json" }
                });

                const options = {
                    hostname: 'generativelanguage.googleapis.com',
                    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(geminiData)
                    }
                };

                const geminiReq = https.request(options, (geminiRes) => {
                    let responseBody = '';
                    geminiRes.on('data', (d) => { responseBody += d; });
                    geminiRes.on('end', () => {
                        const geminiJson = JSON.parse(responseBody);
                        const aiText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

                        // 🔄 Map Gemini -> OpenAI format for Frontend
                        res.writeHead(geminiRes.statusCode, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            choices: [{ message: { content: aiText } }]
                        }));
                    });
                });

                geminiReq.on('error', (e) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Gemini API Connection Failed' }));
                });

                geminiReq.write(geminiData);
                geminiReq.end();

            } else if (openaiKey) {
                // 🚀 FALLBACK TO OPENAI (Requires Credits)
                // [Existing OpenAI Native Logic]
                const openaiData = JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Name: ${name}. Title: ${title}. Skills: ${skills}. Experience: ${experience}. Goals: ${goals}.` }
                    ]
                });

                const options = {
                    hostname: 'api.openai.com',
                    path: '/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiKey}`,
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

                openaiReq.write(openaiData);
                openaiReq.end();
            } else {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No API Key configured on Vercel.' }));
            }

        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid Request Body' }));
        }
    });
};
