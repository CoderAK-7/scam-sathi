/**
 * ScamSathi Universal Scam Guardian - Background Service Worker (Manifest V3)
 * Provides Context Menu support and lifecycle management
 */

try {
    importScripts("detection/detector.js");
} catch (err) {
    console.error("[ScamSathi] Failed to import detector in background:", err);
}

chrome.runtime.onInstalled.addListener(() => {
    console.log("[ScamSathi Guardian] Installed successfully.");

    // Create Context Menu option for highlighted text
    if (chrome.contextMenus) {
        chrome.contextMenus.create({
            id: "scamsathi-scan-selection",
            title: "🛡️ Scan selection with ScamSathi",
            contexts: ["selection"]
        });
    }
});

// Handle Context Menu clicks
if (chrome.contextMenus) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === "scamsathi-scan-selection" && info.selectionText) {
            const selectedText = info.selectionText.trim();
            if (!selectedText) return;

            let verdict = "Low Risk";
            let score = 0;
            let category = "General";

            if (typeof ScamSathiDetector !== "undefined") {
                const analysis = ScamSathiDetector.evaluateMessageHeuristics(selectedText);
                verdict = analysis.status;
                score = analysis.score;
                category = analysis.category;
            }

            // Execute a lightweight alert in the current tab to show verdict immediately
            if (tab && tab.id) {
                chrome.scripting ? chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (v, s, cat) => {
                        alert(`🛡️ ScamSathi Guardian Evaluation:\n\nVerdict: ${v} (${s}/100)\nCategory: ${cat}\n\nFor details, open the ScamSathi extension from your toolbar.`);
                    },
                    args: [verdict, score, category]
                }).catch(() => {}) : null;
            }
        }
    });
}

