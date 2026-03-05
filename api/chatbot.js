module.exports = async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
        const message = String(body.message || "").trim();
        const model = String(body.model || "gemini-1.5-flash").trim();

        if (!message) {
            return res.status(422).json({ error: "Message is required." });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Server API key is not configured." });
        }

        const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: message }]
                    }
                ]
            })
        });

        const data = await upstream.json();
        if (!upstream.ok) {
            return res.status(upstream.status).json({
                error: data?.error?.message || "Gemini API request failed."
            });
        }

        const parts = data?.candidates?.[0]?.content?.parts || [];
        const textParts = parts.map((p) => p?.text).filter(Boolean);

        return res.status(200).json({
            reply: textParts.join("\n").trim() || "No response received."
        });
    } catch (error) {
        return res.status(500).json({
            error: error?.message || "Internal server error."
        });
    }
};
