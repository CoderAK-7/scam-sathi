/**
 * ScamSathi Universal Scam Guardian - WhatsApp Web Integration
 * 
 * Rules:
 * - Operates strictly on web.whatsapp.com.
 * - Automatically detects incoming messages via MutationObserver.
 * - Avoids infinite loops by ignoring ScamSathi's own injected UI elements.
 * - Scans incoming messages only (strictly ignores messages sent by user).
 * - Avoids duplicate scanning using data-scamsathi-scanned attribute.
 * - Retains manual "Scan Chat" button functionality.
 * - 100% client-side local heuristics (ScamSathiDetector).
 */

(function () {
    if (!window.location.hostname.includes("web.whatsapp.com")) return;

    console.log("[ScamSathi] WhatsApp Web Guardian Module initialized.");

    let scanTimer = null;

    // Inject styles for header button, bubble highlights, and inline warning card
    function injectStyles() {
        if (document.getElementById("scamsathi-wa-styles")) return;
        const style = document.createElement("style");
        style.id = "scamsathi-wa-styles";
        style.textContent = `
            .scamsathi-wa-header-btn {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: #070c18;
                color: #00f2fe;
                border: 1px solid rgba(0, 242, 254, 0.4);
                padding: 4px 10px;
                border-radius: 14px;
                font-size: 11.5px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0, 242, 254, 0.15);
                transition: all 0.2s ease;
                margin-right: 8px;
            }
            .scamsathi-wa-header-btn:hover {
                background: #00f2fe;
                color: #070c18;
            }
            .scamsathi-flagged-high {
                border-left: 4px solid #ef4444 !important;
                background-color: rgba(239, 68, 68, 0.05) !important;
            }
            .scamsathi-flagged-review {
                border-left: 4px solid #f59e0b !important;
                background-color: rgba(245, 158, 11, 0.05) !important;
            }
            .scamsathi-inline-card {
                margin-top: 6px;
                margin-bottom: 2px;
                padding: 6px 9px;
                border-radius: 7px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 11.5px;
                line-height: 1.35;
                display: flex;
                flex-direction: column;
                gap: 3px;
                animation: scamsathiFadeIn 0.2s ease;
                user-select: text;
                clear: both;
            }
            .scamsathi-inline-card.high {
                background: #18090b;
                border: 1px solid rgba(239, 68, 68, 0.5);
                color: #fecaca;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
            }
            .scamsathi-inline-card.review {
                background: #181105;
                border: 1px solid rgba(245, 158, 11, 0.5);
                color: #fef3c7;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);
            }
            .scamsathi-inline-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 6px;
            }
            .scamsathi-inline-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-weight: 800;
                font-size: 11px;
                text-transform: uppercase;
            }
            .scamsathi-inline-card.high .scamsathi-inline-badge { color: #ef4444; }
            .scamsathi-inline-card.review .scamsathi-inline-badge { color: #f59e0b; }
            .scamsathi-inline-score {
                background: rgba(0, 0, 0, 0.3);
                padding: 1px 5px;
                border-radius: 4px;
                font-family: monospace;
                font-weight: 700;
                font-size: 10.5px;
                color: #ffffff;
            }
            .scamsathi-inline-dismiss {
                background: transparent;
                border: none;
                color: inherit;
                opacity: 0.6;
                cursor: pointer;
                font-size: 13px;
                padding: 0 3px;
                line-height: 1;
            }
            .scamsathi-inline-dismiss:hover { opacity: 1; }
            .scamsathi-inline-reasons {
                font-size: 11px;
                color: #e2e8f0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .scamsathi-inline-reason-item {
                display: flex;
                align-items: baseline;
                gap: 4px;
            }
            .scamsathi-reason-bullet {
                color: #00f2fe;
                font-weight: bold;
                font-size: 10px;
            }
            .scamsathi-inline-action {
                font-size: 10.5px;
                margin-top: 3px;
                padding-top: 3px;
                border-top: 1px dashed rgba(255, 255, 255, 0.15);
                color: #cbd5e1;
                font-weight: 600;
            }
            .scamsathi-wa-modal {
                position: fixed;
                top: 60px;
                right: 20px;
                width: 320px;
                background: #0d1527;
                color: #f1f5f9;
                border: 1px solid rgba(0, 242, 254, 0.3);
                border-radius: 10px;
                padding: 12px 14px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.5);
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 12px;
                animation: scamsathiFadeIn 0.2s ease;
            }
            .scamsathi-wa-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                padding-bottom: 6px;
                margin-bottom: 8px;
            }
            .scamsathi-wa-modal-title {
                font-weight: 800;
                color: #00f2fe;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            @keyframes scamsathiFadeIn {
                from { opacity: 0; transform: translateY(-4px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    // Inject "Scan Chat" button in WhatsApp Web conversation header
    function injectHeaderButton() {
        injectStyles();

        const mainPanel = document.getElementById("main") || document.querySelector("[data-testid='conversation-panel-messages']")?.closest("#main");
        if (!mainPanel) return;

        const header = mainPanel.querySelector("header");
        if (!header || header.querySelector(".scamsathi-wa-header-btn")) return;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "scamsathi-wa-header-btn";
        btn.innerHTML = "🛡️ Scan Chat";
        btn.title = "Scan visible messages for Indian cyber scams (UPI, APK, KYC, prize fraud)";

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            scanVisibleChat(true);
        });

        header.insertBefore(btn, header.lastElementChild);
    }

    // Attach inline warning card to suspicious message bubble
    function attachWarningCard(row, analysis) {
        if (row.querySelector(".scamsathi-inline-card")) return;

        const isHigh = analysis.score >= 60;
        const riskClass = isHigh ? "high" : "review";
        const icon = isHigh ? "🚨" : "⚠️";
        const riskLabel = isHigh ? "High Scam Risk" : "Review Advised";

        row.classList.add(isHigh ? "scamsathi-flagged-high" : "scamsathi-flagged-review");

        const card = document.createElement("div");
        card.className = `scamsathi-inline-card ${riskClass}`;

        const topSignals = (analysis.signals || []).slice(0, 2);
        const reasonsHtml = topSignals.length > 0
            ? topSignals.map(s => `
                <div class="scamsathi-inline-reason-item">
                    <span class="scamsathi-reason-bullet">⚡</span>
                    <span><strong>${escapeHTML(s.name)}:</strong> ${escapeHTML(s.sub)}</span>
                </div>
              `).join("")
            : `<div class="scamsathi-inline-reason-item"><span>${escapeHTML(analysis.category)}</span></div>`;

        card.innerHTML = `
            <div class="scamsathi-inline-header">
                <div class="scamsathi-inline-badge">
                    <span>${icon} ${riskLabel}</span>
                    <span class="scamsathi-inline-score">${analysis.score}/100</span>
                </div>
                <button type="button" class="scamsathi-inline-dismiss" title="Dismiss warning">✖</button>
            </div>
            <div class="scamsathi-inline-reasons">
                ${reasonsHtml}
            </div>
            <div class="scamsathi-inline-action">
                🛡️ <strong>Safety Advice:</strong> ${escapeHTML(analysis.actions[0] || "Verify sender through official channels.")}
                ${isHigh ? " | <strong>Helpline: 1930</strong>" : ""}
            </div>
        `;

        card.querySelector(".scamsathi-inline-dismiss").addEventListener("click", (e) => {
            e.stopPropagation();
            card.remove();
            row.classList.remove("scamsathi-flagged-high", "scamsathi-flagged-review");
        });

        const targetArea = row.querySelector(".copyable-text") || row;
        targetArea.appendChild(card);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /**
     * Returns the best available message-list container.
     * WhatsApp Web uses several possible roots depending on version.
     */
    function getMainPanel() {
        return (
            document.querySelector("[data-testid='conversation-panel-messages']") ||
            document.querySelector("#main div[tabindex='-1']") ||
            document.getElementById("main") ||
            document.body
        );
    }

    /**
     * Given ANY element inside a chat pane, walk up to find the nearest
     * element that carries a data-id attribute (the true message row).
     */
    function resolveMessageRow(el) {
        let node = el;
        while (node && node !== document.body) {
            if (node.dataset && node.dataset.id) return node;
            node = node.parentElement;
        }
        return null;
    }

    /**
     * Return true if this message row was sent by the OTHER person (incoming).
     * Strategy (in priority order):
     *   1. data-id starts with "false_"  → incoming
     *   2. data-id starts with "true_"   → outgoing  (skip)
     *   3. element has class message-in  → incoming
     *   4. element has class message-out → outgoing  (skip)
     *   5. no signal found               → skip conservatively
     */
    function isIncoming(row) {
        const id = row.getAttribute("data-id") || "";
        if (id.startsWith("false_")) return true;
        if (id.startsWith("true_"))  return false;
        if (row.classList.contains("message-in"))  return true;
        if (row.classList.contains("message-out")) return false;
        // Walk ancestors for class hints
        const inAnc  = row.closest(".message-in");
        const outAnc = row.closest(".message-out");
        if (inAnc && !outAnc)  return true;
        if (outAnc && !inAnc)  return false;
        return false; // conservative: skip if uncertain
    }

    /**
     * Extract plain text from a message row.
     * Tries multiple selector strategies used across WhatsApp Web versions.
     */
    function extractText(row) {
        const selectors = [
            "span.selectable-text.copyable-text",
            "span[class*='selectable-text']",
            ".copyable-text span",
            "[data-testid='msg-container'] span",
            "span[dir]"
        ];
        for (const sel of selectors) {
            const el = row.querySelector(sel);
            if (!el) continue;
            const clone = el.cloneNode(true);
            clone.querySelectorAll(".scamsathi-inline-card, .scamsathi-wa-modal").forEach(n => n.remove());
            const t = (clone.innerText || clone.textContent || "").trim();
            if (t.length >= 5) return t;
        }
        return "";
    }

    // ── scan function ─────────────────────────────────────────────────────────

    // Inspect visible messages in active chat
    function scanVisibleChat(isManual) {
        const detector = window.ScamSathiDetector;
        if (!detector) {
            console.warn("[ScamSathi] Detector not loaded yet.");
            return;
        }

        const mainPanel = getMainPanel();

        // ── DIAGNOSTIC: log what we are searching inside ──
        console.log("[ScamSathi] scanVisibleChat | manual:", isManual, "| panel:", mainPanel?.tagName, mainPanel?.id || mainPanel?.dataset?.testid || "(no id)");

        // ── Step 1: find ALL div[data-id] elements (most reliable anchor) ──
        const allMsgRows = Array.from(mainPanel.querySelectorAll("div[data-id]"));

        // ── DIAGNOSTIC ──
        console.log("[ScamSathi] div[data-id] rows found:", allMsgRows.length);

        if (allMsgRows.length === 0) {
            // Fallback: try message-in / message-out class selectors
            const fallback = mainPanel.querySelectorAll(".message-in, .message-out");
            console.log("[ScamSathi] Fallback .message-in/.message-out rows:", fallback.length);
            if (fallback.length === 0 && isManual) {
                showToastCard("⚠️ ScamSathi: No message containers found. Open a chat first.");
                return;
            }
        }

        // ── Step 2: classify & deduplicate ──
        const incomingRows = [];
        const outgoingRows = [];
        const seenIds = new Set();

        for (const row of allMsgRows) {
            const id = row.getAttribute("data-id") || "";
            if (seenIds.has(id)) continue;
            seenIds.add(id);

            if (isIncoming(row)) {
                incomingRows.push(row);
            } else {
                outgoingRows.push(row);
            }
        }

        // ── DIAGNOSTIC ──
        console.log("[ScamSathi] Incoming rows:", incomingRows.length, "| Outgoing rows:", outgoingRows.length);

        if (incomingRows.length === 0 && isManual) {
            showToastCard("No visible incoming messages detected in this conversation view.");
            return;
        }

        let flaggedCount = 0;
        let highestRisk = null;

        for (const row of incomingRows) {
            // Skip already scanned (automatic mode only)
            if (!isManual && row.dataset.scamsathiScanned === "true") continue;

            const text = extractText(row);

            // ── DIAGNOSTIC (text length only — never log private content) ──
            console.log("[ScamSathi] Incoming msg | id prefix:", (row.getAttribute("data-id") || "").slice(0, 8), "| text length:", text.length);

            if (!text) continue;

            // Mark as scanned
            row.dataset.scamsathiScanned = "true";

            try {
                const analysis = detector.evaluateMessageHeuristics(text);
                console.log("[ScamSathi] Score:", analysis.score, "| Category:", analysis.category);

                if (analysis.score >= 30) {
                    flaggedCount++;
                    attachWarningCard(row, analysis);
                    if (!highestRisk || analysis.score > highestRisk.score) {
                        highestRisk = { analysis, text };
                    }
                }
            } catch (err) {
                console.error("[ScamSathi] Evaluation error:", err);
            }
        }

        // ── Manual scan result modal ──
        if (isManual) {
            if (flaggedCount > 0 && highestRisk) {
                showResultModal(highestRisk.analysis, flaggedCount);
            } else {
                showToastCard("✅ ScamSathi Pass: No suspicious patterns found in visible messages.");
            }
        }
    }

    function showResultModal(analysis, totalFlagged) {
        const existing = document.getElementById("scamsathi-wa-modal");
        if (existing) existing.remove();

        const modal = document.createElement("div");
        modal.id = "scamsathi-wa-modal";
        modal.className = "scamsathi-wa-modal";
        modal.innerHTML = `
            <div class="scamsathi-wa-modal-header">
                <div class="scamsathi-wa-modal-title">
                    <span>🛡️ ScamSathi Guardian</span>
                </div>
                <button type="button" style="background:none;border:none;color:#fff;cursor:pointer;font-size:14px;" id="scamsathiWaClose">✖</button>
            </div>
            <div style="margin-bottom: 6px; font-weight: 700; color: ${analysis.score >= 60 ? '#ef4444' : '#f59e0b'};">
                ${analysis.score >= 60 ? '🚨 High Risk Detected' : '⚠️ Review Advised'} (${analysis.score}/100)
            </div>
            <div style="font-size: 11.5px; margin-bottom: 8px;">
                <strong>${escapeHTML(analysis.category)}</strong> (${totalFlagged} visible message${totalFlagged > 1 ? 's' : ''} flagged)
            </div>
            <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
                ${escapeHTML(analysis.explanation)}
            </div>
            <div style="font-size: 10.5px; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 4px; margin-bottom: 8px;">
                <strong>Key Advice:</strong> ${escapeHTML(analysis.actions[0] || "Do not click links or send PIN.")}
            </div>
            <div style="font-size: 10px; color: #94a3b8; text-align: center;">
                Emergency Cyber Helpline: <strong>Dial 1930</strong>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector("#scamsathiWaClose").addEventListener("click", () => modal.remove());
    }

    function showToastCard(msg) {
        const existing = document.getElementById("scamsathi-wa-modal");
        if (existing) existing.remove();

        const toast = document.createElement("div");
        toast.id = "scamsathi-wa-modal";
        toast.className = "scamsathi-wa-modal";
        toast.style.width = "280px";
        toast.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11.5px;">${msg}</span>
                <button type="button" style="background:none;border:none;color:#fff;cursor:pointer;" id="scamsathiWaToastClose">✖</button>
            </div>
        `;
        document.body.appendChild(toast);
        toast.querySelector("#scamsathiWaToastClose")?.addEventListener("click", () => toast.remove());
        setTimeout(() => toast.remove(), 4000);
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

    // ── MutationObserver ──────────────────────────────────────────────────────

    /**
     * Attach the MutationObserver to the message-list container.
     * Watching document.body is too broad and fires for every DOM change.
     * We prefer to watch the specific conversation pane so we only react to
     * actual new messages.  Falls back to document.body if pane is not ready.
     */
    let observerTarget = null;
    const observer = new MutationObserver((mutations) => {
        let hasNew = false;
        for (const mut of mutations) {
            for (const node of mut.addedNodes) {
                if (node.nodeType !== 1) continue;
                // Skip ScamSathi's own injected elements (infinite-loop guard)
                if (
                    node.classList.contains("scamsathi-inline-card") ||
                    node.classList.contains("scamsathi-wa-modal") ||
                    node.classList.contains("scamsathi-wa-header-btn")
                ) continue;
                hasNew = true;
                break;
            }
            if (hasNew) break;
        }

        if (hasNew) {
            if (scanTimer) clearTimeout(scanTimer);
            scanTimer = setTimeout(() => {
                injectHeaderButton();
                scanVisibleChat(false);
                // Re-anchor observer if WhatsApp swapped the message container (chat switch)
                reAnchorObserver();
            }, 300);
        }
    });

    /**
     * Point the observer at the most specific available container.
     * Called on load and every time a chat switch may have replaced the pane.
     */
    function reAnchorObserver() {
        const target =
            document.querySelector("[data-testid='conversation-panel-messages']") ||
            document.querySelector("#main div[tabindex='-1']") ||
            document.getElementById("main") ||
            document.body;

        if (target !== observerTarget) {
            observer.disconnect();
            observerTarget = target;
            observer.observe(target, { childList: true, subtree: true });
            console.log("[ScamSathi] Observer anchored to:", target?.tagName, target?.id || target?.dataset?.testid || "(root)");
        }
    }

    // Initial anchor
    reAnchorObserver();

    // Initial sweeps — staggered to cover slow WhatsApp load times
    setTimeout(() => { injectHeaderButton(); scanVisibleChat(false); reAnchorObserver(); }, 1500);
    setTimeout(() => { injectHeaderButton(); scanVisibleChat(false); reAnchorObserver(); }, 3500);
    setTimeout(() => { injectHeaderButton(); scanVisibleChat(false); reAnchorObserver(); }, 6000);

})();
