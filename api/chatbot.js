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
        const SYSTEM_PROMPT = `You are MuntiCare AI Assistant, a helpful and friendly virtual clinic assistant for the MuntiCare Healthcare Management System.

Your role is to assist patients and visitors with general healthcare support and clinic-related information.

You can help users with the following:

1. Appointment Assistant
- Help users with booking, checking, or managing clinic appointments.
- Provide information about doctor availability, clinic schedules, and appointment requirements.
- Guide users on how to set or prepare for an appointment.

2. Symptom Checker
- Allow users to describe their symptoms.
- Provide general health information and possible common causes.
- Suggest basic self-care advice such as rest, hydration, and healthy practices.
- Do NOT diagnose medical conditions.

3. Health FAQ
- Answer common questions about clinic services, schedules, requirements, and available healthcare programs.
- Provide simple and easy-to-understand explanations.

4. Medicine Guidance
- Provide general information about common medications and their usual purpose.
- Give safety reminders about proper use of medicine.
- Never prescribe medicine or give exact dosage instructions.

Safety Rules:
- Do not provide medical diagnosis.
- Do not replace professional healthcare advice.
- For serious symptoms (such as chest pain, difficulty breathing, severe pain, or emergencies), advise the user to seek immediate medical attention.

Tone Guidelines:
- Be friendly, respectful, and supportive.
- Keep answers clear, short, and helpful.
- Focus on guiding users to proper healthcare services when needed.
- Do not use markdown formatting or symbols like *, **, or ***.`;

        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
        const message = String(body.message || "").trim();
        const preferredGeminiModel = String(body.model || "gemini-1.5-flash-8b").trim();

        if (!message) {
            return res.status(422).json({ error: "Message is required." });
        }

        const localFaqReply = getLocalFaqResponse(message);
        if (localFaqReply) {
            return res.status(200).json({ reply: localFaqReply });
        }

        const groqApiKey = process.env.GROQ_API_KEY || "";
        const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

        let rawReply = "";
        let groqFailure = null;

        if (groqApiKey) {
            const groqResult = await requestGroq({
                apiKey: groqApiKey,
                systemPrompt: SYSTEM_PROMPT,
                userMessage: message
            });

            if (groqResult.ok) {
                rawReply = groqResult.reply;
            } else {
                groqFailure = groqResult;
            }
        } else {
            groqFailure = { ok: false, status: 500, error: "Groq API key is not configured." };
        }

        if (!rawReply) {
            const canFallbackToGemini = groqFailure && isGroqQuotaError(groqFailure.status, groqFailure.error);
            if (!canFallbackToGemini) {
                return res.status(groqFailure?.status || 502).json({
                    error: groqFailure?.error || "Groq API request failed."
                });
            }

            if (!geminiApiKey) {
                return res.status(500).json({
                    error: "Groq quota reached, but Gemini API key is not configured."
                });
            }

            const geminiResult = await requestGemini({
                apiKey: geminiApiKey,
                systemPrompt: SYSTEM_PROMPT,
                userMessage: message,
                preferredModel: preferredGeminiModel
            });

            if (!geminiResult.ok) {
                return res.status(geminiResult.status || 502).json({
                    error: geminiResult.error || "Gemini API request failed."
                });
            }
            rawReply = geminiResult.reply;
        }

        const cleanedReply = rawReply
            .replace(/\*{1,}/g, "")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        return res.status(200).json({
            reply: cleanedReply || "No response received."
        });
    } catch (error) {
        return res.status(500).json({
            error: error?.message || "Internal server error."
        });
    }
};

function getLocalFaqResponse(message) {
    const text = String(message || "").toLowerCase();
    const guidance =
        "This information is for general guidance only and should not replace professional medical advice. Please consult a licensed healthcare professional for proper diagnosis and treatment.";

    const faqs = [
        {
            keys: ["clinic hour", "opening hour", "open time", "close time", "what time", "schedule"],
            reply:
                "MuntiCare clinic hours are typically Monday to Saturday, 8:00 AM to 5:00 PM. Sunday and holidays may have limited services. Please check the appointments page for updated schedules."
        },
        {
            keys: ["service", "available service", "offer", "program"],
            reply:
                "MuntiCare offers general consultations, vaccination services, appointment management, and health record support. Available services may vary by doctor schedule."
        },
        {
            keys: ["vaccine", "vaccination", "immunization"],
            reply:
                "For vaccination concerns, you can check vaccine availability and schedules in the system or coordinate with clinic staff for the next available slot."
        },
        {
            keys: ["requirement", "requirements", "what to bring", "documents", "valid id", "insurance"],
            reply:
                "Common appointment requirements are a valid ID, relevant previous medical records, and any referral or prescription if available. Bring your insurance details if applicable."
        },
        {
            keys: ["location", "address", "where is", "contact", "phone", "email"],
            reply:
                "For clinic location and contact details, please refer to the MuntiCare system Contact/Info section or ask front desk support for the latest official information."
        },
        {
            keys: ["book appointment", "set appointment", "make appointment", "appointment"],
            reply:
                "To book an appointment, open the Appointments section, choose your preferred date and time, select a doctor, then confirm your request. Please arrive early on your appointment day."
        }
    ];

    for (const item of faqs) {
        if (item.keys.some((k) => text.includes(k))) {
            return `${item.reply}\n\n${guidance}`;
        }
    }

    return "";
}

async function requestGroq({ apiKey, systemPrompt, userMessage }) {
    const modelCandidates = [
        process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile"
    ];

    let lastStatus = 502;
    let lastError = "Groq API request failed.";

    for (const model of modelCandidates) {
        const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                temperature: 0.4,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ]
            })
        });

        const attempt = await upstream.json().catch(() => ({}));
        if (upstream.ok) {
            const reply = String(attempt?.choices?.[0]?.message?.content || "").trim();
            return { ok: true, reply };
        }

        lastStatus = upstream.status;
        lastError = attempt?.error?.message || "Groq API request failed.";
        const msg = String(lastError).toLowerCase();
        const isModelNotFound = upstream.status === 404 || msg.includes("model") && msg.includes("not");
        if (!isModelNotFound) {
            return { ok: false, status: lastStatus, error: lastError };
        }
    }

    return { ok: false, status: lastStatus, error: lastError };
}

async function requestGemini({ apiKey, systemPrompt, userMessage, preferredModel }) {
    const modelCandidates = [
        preferredModel,
        "gemini-1.5-flash-8b",
        "gemini-1.5-flash-latest",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.5-flash"
    ];

    let lastError = "Gemini API request failed.";
    let lastStatus = 502;

    for (const model of modelCandidates) {
        const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: "user", parts: [{ text: userMessage }] }]
                })
            }
        );

        const attempt = await upstream.json().catch(() => ({}));
        if (upstream.ok) {
            const parts = attempt?.candidates?.[0]?.content?.parts || [];
            const textParts = parts.map((p) => p?.text).filter(Boolean);
            return { ok: true, reply: textParts.join("\n").trim() };
        }

        lastStatus = upstream.status;
        lastError = attempt?.error?.message || "Gemini API request failed.";
        const msg = String(lastError).toLowerCase();
        const isModelNotFound = upstream.status === 404 || msg.includes("not found") || msg.includes("not supported");
        if (!isModelNotFound) {
            return { ok: false, status: lastStatus, error: lastError };
        }
    }

    return { ok: false, status: lastStatus, error: lastError };
}

function isGroqQuotaError(status, message) {
    const msg = String(message || "").toLowerCase();
    if (status === 429 || status === 402) return true;
    return (
        msg.includes("quota") ||
        msg.includes("rate limit") ||
        msg.includes("insufficient") ||
        msg.includes("credit") ||
        msg.includes("exceeded")
    );
}
