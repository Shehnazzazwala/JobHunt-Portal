const axios = require('axios');

module.exports = async (req, res) => {
    // 🛡️ CORS Headers (Allow browser access)
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')

    // Handle Preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    // 🛡️ Only allow POST for the logic
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { name, title, skills, experience, goals, systemPrompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API Key not configured on server (Check Environment Variables).' });
    }

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-5-nano",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Name: ${name}. Title: ${title}. Skills: ${skills}. Experience: ${experience}. Summary goals: ${goals}.` }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error("Serverless Function Error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to connect to OpenAI" });
    }
};
