let chatStarted = false;
let isSending = false;
const EMERGENCY_KEYWORDS = [
    "chest pain",
    "can't breathe",
    "cannot breathe",
    "shortness of breath",
    "difficulty breathing",
    "severe bleeding",
    "bleeding heavily",
    "stroke",
    "face drooping",
    "slurred speech",
    "heart attack",
    "unconscious",
    "passed out",
    "seizure",
    "suicidal",
    "suicide",
    "kill myself",
    "overdose",
    "poisoned",
    "anaphylaxis"
];

const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("msg");
const sendBtn = document.getElementById("sendBtn");
const quickReplyButtons = document.querySelectorAll(".quick-reply-btn");

if (sendBtn) sendBtn.addEventListener("click", sendMsg);
if (inputEl) {
    inputEl.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMsg();
    });
}
if (quickReplyButtons.length) {
    quickReplyButtons.forEach((btn) => {
        btn.addEventListener("click", () => sendMsg(btn.getAttribute("data-message") || ""));
    });
}

function appendMessage(text, sender = "me") {
    if (!chatEl) return;

    if (!chatStarted) {
        chatEl.innerHTML = "";
        chatStarted = true;
    }

    if (sender === "bot") {
        const row = document.createElement("div");
        row.className = "msg-row bot-row";

        const avatar = document.createElement("img");
        avatar.className = "msg-avatar";
        avatar.src = "image/Muni.jpeg";
        avatar.alt = "Bot";

        const bubble = document.createElement("div");
        bubble.classList.add("bubble", "bot");
        bubble.innerText = String(text || "");

        row.appendChild(avatar);
        row.appendChild(bubble);
        chatEl.appendChild(row);
    } else {
        const div = document.createElement("div");
        div.classList.add("bubble", sender);
        div.innerText = String(text || "");
        chatEl.appendChild(div);
    }
    chatEl.scrollTop = chatEl.scrollHeight;
}

function showTypingIndicator() {
    if (!chatEl) return;
    const row = document.createElement("div");
    row.className = "msg-row bot-row";
    row.id = "typing-indicator";

    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = "image/Muni.jpeg";
    avatar.alt = "Bot";

    const div = document.createElement("div");
    div.classList.add("typing-indicator");
    div.innerHTML = "<span></span><span></span><span></span>";

    row.appendChild(avatar);
    row.appendChild(div);
    chatEl.appendChild(row);
    chatEl.scrollTop = chatEl.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) indicator.remove();
}

function hasEmergencyKeyword(text) {
    const lower = String(text || "").toLowerCase();
    return EMERGENCY_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function appendEmergencyWarning() {
    if (!chatEl) return;

    if (!chatStarted) {
        chatEl.innerHTML = "";
        chatStarted = true;
    }

    const row = document.createElement("div");
    row.className = "msg-row bot-row";

    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = "image/Muni.jpeg";
    avatar.alt = "Bot";

    const bubble = document.createElement("div");
    bubble.className = "bubble bot alert-emergency";
    bubble.innerText = "Emergency warning: Your message may indicate a medical emergency. Call local emergency services now or go to the nearest emergency room immediately.";

    row.appendChild(avatar);
    row.appendChild(bubble);
    chatEl.appendChild(row);
    chatEl.scrollTop = chatEl.scrollHeight;
}

function getConfig() {
    const cfg = window.CHATBOT_CONFIG || {};
    return {
        endpoint: String(cfg.endpoint || "").trim(),
        model: String(cfg.model || "gemini-1.5-flash").trim()
    };
}

async function sendViaBackend(endpoint, message, model) {
    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message, model })
    });

    const raw = await res.text();
    let data = {};
    try {
        data = raw ? JSON.parse(raw) : {};
    } catch {
        data = {};
    }

    if (!res.ok) {
        const fallback =
            endpoint === "/api/chatbot"
                ? "Backend endpoint not available locally. Run this on Vercel (or local serverless dev), or point endpoint to your local API."
                : "Backend request failed.";
        throw new Error(data?.error || fallback);
    }
    return data.reply || data.output_text || (raw || "No response received");
}

async function sendMsg(presetText) {
    const text = String((presetText ?? inputEl?.value) || "").trim();
    if (!text || isSending) return;

    appendMessage(text, "me");
    if (inputEl) inputEl.value = "";

    if (hasEmergencyKeyword(text)) {
        appendEmergencyWarning();
        return;
    }

    isSending = true;
    if (sendBtn) sendBtn.disabled = true;
    showTypingIndicator();

    try {
        const config = getConfig();
        if (!config.endpoint) throw new Error("No chatbot endpoint configured.");
        const reply = await sendViaBackend(config.endpoint, text, config.model);
        appendMessage(reply, "bot");
    } catch (error) {
        appendMessage(error?.message || "Sorry, there was an error. Please try again.", "bot");
        console.error("Chatbot error:", error);
    } finally {
        removeTypingIndicator();
        isSending = false;
        if (sendBtn) sendBtn.disabled = false;
    }
}
