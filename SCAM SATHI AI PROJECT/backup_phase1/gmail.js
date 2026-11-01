/**
 * ScamSathi Universal Scam Guardian - Gmail Integration
 * 
 * Rules:
 * - Scans ONLY the currently open email upon explicit user action.
 * - Never scans the entire inbox or other emails in background.
 * - Never opens suspicious links automatically.
 * - Runs 100% locally using ScamSathiDetector heuristics.
 */

(function () {
    if (!window.location.hostname.includes("mail.google.com")) return;

    console.log("[ScamSathi] Gmail Guardian Module initialized.");

    // Inject styles for Gmail scanner button & alert banner
    function injectStyles() {
        if (document.getElementById("scamsathi-gmail-styles")) return;
        const style = document.createElement("style");
        style.id = "scamsathi-gmail-styles";
        style.textContent = `
            .scamsathi-gmail-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: linear-gradient(135deg, #070c18, #0f1c38);
                color: #00f2fe;
                border: 1px solid rgba(0, 242, 254, 0.4);
                padding: 5px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 700;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0, 242, 254, 0.15);
                transition: all 0.2s ease;
                margin-left: 8px;
                vertical-align: middle;
            }
            .scamsathi-gmail-btn:hover {
                background: #00f2fe;
                color: #070c18;
                box-shadow: 0 3px 10px rgba(0, 242, 254, 0.35);
                transform: translateY(-1px);
            }
            .scamsathi-alert-banner {
                margin: 12px 0 16px 0;
                padding: 14px 16px;
                border-radius: 10px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                animation: scamsathiFadeIn 0.25s ease;
                position: relative;
                z-index: 10;
            }
            .scamsathi-alert-banner.high {
                background: #18090b;
                border: 2px solid #ef4444;
                color: #fecaca;
                box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
            }
            .scamsathi-alert-banner.review {
                background: #181105;
                border: 2px solid #f59e0b;
                color: #fef3c7;
                box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
            }
            .scamsathi-alert-banner.safe {
                background: #061510;
                border: 2px solid #10b981;
                color: #d1fae5;
                box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
            }
            .scamsathi-banner-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            .scamsathi-verdict-title {
                font-size: 14px;
                font-weight: 800;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .scamsathi-score-pill {
                background: rgba(0,0,0,0.3);
                padding: 2px 8px;
                border-radius: 12px;
                font-family: monospace;
                font-size: 13px;
                font-weight: 800;
            }
            .scamsathi-close-btn {
                background: transparent;
                border: none;
                color: inherit;
                font-size: 16px;
                cursor: pointer;
                opacity: 0.7;
                padding: 2px 6px;
            }
            .scamsathi-close-btn:hover {
                opacity: 1;
            }
            .scamsathi-signals-box {
                margin: 8px 0;
                padding: 8px 10px;
                background: rgba(0, 0, 0, 0.25);
                border-radius: 6px;
                font-size: 12px;
            }
            .scamsathi-signal-item {
                margin: 4px 0;
                display: flex;
                align-items: flex-start;
                gap: 6px;
            }
            .scamsathi-action-tip {
                font-size: 12px;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px dashed rgba(255,255,255,0.15);
                font-weight: 600;
            }
            @keyframes scamsathiFadeIn {
                from { opacity: 0; transform: translateY(-6px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    // Attempt to inject scan button into opened email view
    function checkAndInjectButton() {
        injectStyles();

        // Target active email view container in Gmail
        const emailContainers = document.querySelectorAll(".adn.ads, .nH.hx .gE.iv.gt, div[role='main'] .hP");
        
        emailContainers.forEach(container => {
            // Find an appropriate anchor point near subject or top header
            const headerAnchor = container.closest(".nH")?.querySelector(".ha") || 
                                 container.closest(".adn")?.querySelector(".gE.iv.gt") ||
                                 container;

            if (headerAnchor && !headerAnchor.querySelector(".scamsathi-gmail-btn")) {
                const scanBtn = document.createElement("button");
                scanBtn.type = "button";
                scanBtn.className = "scamsathi-gmail-btn";
                scanBtn.innerHTML = `🛡️ Scan with ScamSathi`;
                scanBtn.title = "Local-first security inspection for Indian cyber scams (UPI, APK, KYC, phishing)";

                scanBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    scanCurrentEmail(container);
                });

                headerAnchor.appendChild(scanBtn);
            }
        });
    }

    // Extract visible email text and evaluate
    function scanCurrentEmail(container) {
        const root = container.closest(".adn") || container.closest(".nH") || document.querySelector("div[role='main']");
        if (!root) return;

        // Extract visible subject
        const subjectEl = document.querySelector("h2.hP") || root.querySelector("h2");
        const subjectText = subjectEl ? subjectEl.textContent.trim() : "";

        // Extract visible message body (from .a3s.aiL or standard email body container)
        const bodyEl = root.querySelector(".a3s.aiL, div[dir='ltr'], .ii.gt");
        const bodyText = bodyEl ? bodyEl.innerText.trim() : "";

        const fullEmailText = `${subjectText}\n\n${bodyText}`.trim();
        if (!fullEmailText) {
            alert("[ScamSathi] Could not detect visible email text to inspect.");
            return;
        }

        // Run local heuristic evaluator
        const detector = window.ScamSathiDetector;
        if (!detector) {
            alert("[ScamSathi] Detection engine not loaded.");
            return;
        }

        const analysis = detector.evaluateMessageHeuristics(fullEmailText);

        // Remove any previous banner
        const existingBanner = root.querySelector(".scamsathi-alert-banner");
        if (existingBanner) existingBanner.remove();

        // Build alert banner
        const banner = document.createElement("div");
        const isHigh = analysis.score >= 60;
        const isReview = analysis.score >= 30 && analysis.score < 60;
        const statusClass = isHigh ? "high" : (isReview ? "review" : "safe");
        const icon = isHigh ? "🚨" : (isReview ? "⚠️" : "✅");

        banner.className = `scamsathi-alert-banner ${statusClass}`;
        banner.innerHTML = `
            <div class="scamsathi-banner-header">
                <div class="scamsathi-verdict-title">
                    <span>${icon} ScamSathi Guardian:</span>
                    <span>${escapeHTML(analysis.category)}</span>
                    <span class="scamsathi-score-pill">${analysis.score}/100 · ${analysis.status}</span>
                </div>
                <button type="button" class="scamsathi-close-btn" title="Dismiss Alert">✖</button>
            </div>

            <div style="font-size: 13px; line-height: 1.45;">
                ${escapeHTML(analysis.explanation)}
            </div>

            ${analysis.signals.length > 0 ? `
                <div class="scamsathi-signals-box">
                    <strong>⚡ Detected Threat Signals:</strong>
                    ${analysis.signals.map(s => `
                        <div class="scamsathi-signal-item">
                            <span>•</span>
                            <span><strong>${escapeHTML(s.name)}:</strong> ${escapeHTML(s.sub)} (+${s.weight} pts)</span>
                        </div>
                    `).join("")}
                </div>
            ` : ""}

            <div class="scamsathi-action-tip">
                🛡️ <strong>Recommended Action:</strong> ${escapeHTML(analysis.actions[0] || "Verify sender through official channels.")}
                ${isHigh ? " | <strong>National Cyber Helpline: Dial 1930</strong>" : ""}
            </div>
        `;

        banner.querySelector(".scamsathi-close-btn").addEventListener("click", () => banner.remove());

        // Insert above email body
        if (bodyEl && bodyEl.parentNode) {
            bodyEl.parentNode.insertBefore(banner, bodyEl);
        } else {
            root.insertBefore(banner, root.firstChild);
        }
    }

    function escapeHTML(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Observe DOM changes safely to attach button when an email is opened
    const observer = new MutationObserver(() => {
        checkAndInjectButton();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    // Initial check
    setTimeout(checkAndInjectButton, 1500);

})();

