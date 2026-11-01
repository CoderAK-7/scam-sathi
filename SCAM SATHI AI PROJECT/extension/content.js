/**
 * ScamSathi Universal Scam Guardian - Content Script Coordinator
 * Loads detection runtime and platform handlers safely
 */

console.log("[ScamSathi Guardian] Content script loaded on: " + window.location.hostname);

// Respond to popup query messages if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ping") {
        sendResponse({
            status: "active",
            platform: window.location.hostname.includes("mail.google.com") ? "gmail" :
                      window.location.hostname.includes("web.whatsapp.com") ? "whatsapp" : "other"
        });
    }
    return true;
});

