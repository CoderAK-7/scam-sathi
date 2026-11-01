// @ts-nocheck
/**
 * ScamSathi Universal Scam Guardian — Gmail / Outlook Web Platform Adapter
 *
 * AUTOMATIC EMAIL SCANNING — no button click or copy-paste required.
 *
 * Strategy:
 *  1. MutationObserver watches document.body for DOM changes (Gmail SPA navigation).
 *  2. On each change, debounced tryAutoScan() runs after 600 ms.
 *  3. tryAutoScan() finds the currently open email container via a ranked
 *     selector list and extracts: subject, body text, sender, links.
 *  4. A fingerprint (hash of subject + sender) prevents rescanning the same email.
 *  5. Calls window.MailGuardAnalyzer.analyze() — local, zero network calls.
 *  6. Injects an inline risk banner above the email body (score >= 30 only).
 *  7. Manual "Scan Email" button is still injected as a fallback.
 *
 * Supports: Gmail Web, Outlook Live, Outlook Office
 *
 * Privacy: No email content leaves the browser. No network requests are made.
 */

(function () {
    "use strict";

    var HOST = window.location.hostname;
    var IS_GMAIL   = HOST.includes("mail.google.com");
    var IS_OUTLOOK = HOST.includes("outlook.live.com") || HOST.includes("outlook.office.com");

    if (!IS_GMAIL && !IS_OUTLOOK) return;

    var PLATFORM = IS_GMAIL ? "gmail" : "outlook";
    console.log("[ScamSathi] Email Guardian initialised on:", PLATFORM);

    // ── selector banks ────────────────────────────────────────────────────────
    // Ranked: most specific first. First match wins.

    var SELECTORS = {
        gmail: {
            // Container that wraps an open message thread
            container: [
                'div[data-message-id]',
                '.adn.ads',
                'div[role="main"] .ii.gt',
                'div[role="main"] .a3s'
            ],
            subject: ['h2.hP', 'div[role="main"] h2', 'td.Bu h2'],
            body:    ['.a3s.aiL', '.a3s', '.ii.gt', 'div[dir="ltr"]'],
            senderName:  ['.gD', 'span[name]', '.go'],
            senderEmail: ['.gD[email]', 'span[email]']
        },
        outlook: {
            container: [
                'div[aria-label="Message body"]',
                '[role="main"] [role="region"]',
                '.ReadingPaneContent'
            ],
            subject: [
                '[data-testid="subject"]',
                'h1[role="heading"]',
                '.Subject'
            ],
            body:    [
                'div[aria-label="Message body"]',
                '.ReadingPaneContent .allowTextSelection',
                '[role="main"] [role="region"] div'
            ],
            senderName:  ['[data-testid="senderName"]', '.OZZZK'],
            senderEmail: ['[data-testid="senderEmail"]', 'span[title*="@"]']
        }
    };

    var SEL = SELECTORS[PLATFORM];

    // ── state ─────────────────────────────────────────────────────────────────
    var lastFingerprint = "";
    var scanTimer = null;
    var BANNER_ID = "scamsathi-email-banner";

    // ── helpers ───────────────────────────────────────────────────────────────

    function firstMatch(selList, root) {
        root = root || document;
        for (var i = 0; i < selList.length; i++) {
            try {
                var el = root.querySelector(selList[i]);
                if (el) return el;
            } catch (_) {}
        }
        return null;
    }

    function textOf(el) {
        if (!el) return "";
        var clone = el.cloneNode(true);
        // Remove any ScamSathi banners from clone before reading text
        clone.querySelectorAll("." + BANNER_ID + ", .scamsathi-alert-banner").forEach(function (n) { n.remove(); });
        return (clone.innerText || clone.textContent || "").trim();
    }

    function attrOf(el, attr) {
        if (!el) return "";
        return (el.getAttribute(attr) || el.title || "").trim();
    }

    function fingerprint(subject, senderEmail) {
        return subject.slice(0, 60) + "|" + senderEmail.slice(0, 40);
    }

    function extractLinks(bodyEl) {
        if (!bodyEl) return [];
        var links = [];
        bodyEl.querySelectorAll("a[href]").forEach(function (a) {
            var href = a.href || "";
            if (href && href.indexOf("mailto:") !== 0 && href.indexOf("javascript:") !== 0) {
                links.push(href);
            }
        });
        return links;
    }

    // ── extract current email data ────────────────────────────────────────────

    function extractEmailData() {
        // 1. Find the open email container
        var container = firstMatch(SEL.container);
        if (!container) {
            console.log("[ScamSathi][" + PLATFORM + "] No open email container found.");
            return null;
        }

        // 2. Subject
        var subjectEl = firstMatch(SEL.subject);
        var subject   = subjectEl ? textOf(subjectEl) : "";

        // 3. Body
        var bodyEl  = firstMatch(SEL.body, container) || firstMatch(SEL.body);
        var body    = textOf(bodyEl);

        // 4. Sender
        var senderNameEl  = firstMatch(SEL.senderName);
        var senderEmailEl = firstMatch(SEL.senderEmail);
        var senderName    = textOf(senderNameEl);
        var senderEmail   = attrOf(senderEmailEl, "email") || attrOf(senderEmailEl, "title") || textOf(senderEmailEl);

        // 5. Links
        var links = extractLinks(bodyEl || container);

        console.log("[ScamSathi][" + PLATFORM + "] Email detected | subject len:", subject.length,
            "| body len:", body.length, "| links:", links.length, "| sender:", senderEmail.slice(0, 30));

        if (!subject && !body) return null;

        return {
            subject:     subject,
            body:        body,
            senderName:  senderName,
            senderEmail: senderEmail,
            links:       links,
            container:   container,
            bodyEl:      bodyEl
        };
    }

    // ── inject banner ─────────────────────────────────────────────────────────

    function injectBanner(analysis, emailData) {
        // Remove any old banner
        var old = document.getElementById(BANNER_ID);
        if (old) old.remove();

        // Only show banners for suspicious and above
        if (analysis.score < 30) {
            console.log("[ScamSathi][" + PLATFORM + "] Score", analysis.score, "— no banner (low risk).");
            return;
        }

        var banner;
        if (window.MailGuardWarning && window.MailGuardWarning.buildBanner) {
            banner = window.MailGuardWarning.buildBanner(analysis);
        } else {
            banner = buildFallbackBanner(analysis);
        }

        banner.id = BANNER_ID;

        // Inject above the body or at top of container
        var target = emailData.bodyEl || emailData.container;
        if (target && target.parentNode) {
            target.parentNode.insertBefore(banner, target);
        } else if (emailData.container) {
            emailData.container.insertBefore(banner, emailData.container.firstChild);
        }

        console.log("[ScamSathi][" + PLATFORM + "] Banner injected | score:", analysis.score, "| risk:", analysis.risk);

        // Save to storage for popup display
        try {
            chrome.storage.local.set({
                mailguard_last_scan: {
                    score:    analysis.score,
                    risk:     analysis.risk,
                    category: analysis.category,
                    subject:  emailData.subject.slice(0, 60),
                    platform: PLATFORM,
                    ts:       Date.now()
                }
            });
        } catch (_) {}
    }

    function buildFallbackBanner(analysis) {
        var riskColors = {
            critical:   { border: "#7c3aed", bg: "#f5f3ff", badge: "#7c3aed", icon: "🚨" },
            high:       { border: "#ef4444", bg: "#fef2f2", badge: "#ef4444", icon: "🚨" },
            suspicious: { border: "#f59e0b", bg: "#fffbeb", badge: "#f59e0b", icon: "⚠️" },
            low:        { border: "#10b981", bg: "#ecfdf5", badge: "#10b981", icon: "✅" }
        };
        var c = riskColors[analysis.risk] || riskColors.suspicious;

        var signalsHtml = "";
        if (analysis.signals && analysis.signals.length > 0) {
            signalsHtml = "<div style='margin-top:8px;font-size:12px;'><strong>Detected signals:</strong><ul style='margin:4px 0 0 0;padding-left:18px;'>";
            analysis.signals.slice(0, 4).forEach(function (s) {
                signalsHtml += "<li style='margin:2px 0;'>" + escapeHTML(s.name) + " — " + escapeHTML(s.description) + "</li>";
            });
            signalsHtml += "</ul></div>";
        }

        var actionsHtml = "";
        if (analysis.actions && analysis.actions.length > 0) {
            actionsHtml = "<div style='margin-top:8px;padding-top:8px;border-top:1px dashed rgba(0,0,0,0.1);font-size:12px;'>" +
                "<strong>Recommended action:</strong> " + escapeHTML(analysis.actions[0]) + "</div>";
        }

        var div = document.createElement("div");
        div.style.cssText = [
            "margin:12px 0 16px 0", "padding:14px 16px", "border-radius:8px",
            "border-left:4px solid " + c.border, "background:" + c.bg,
            "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
            "font-size:13px", "line-height:1.5", "position:relative", "z-index:999",
            "box-shadow:0 2px 8px rgba(0,0,0,0.08)"
        ].join(";");

        div.innerHTML =
            "<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;'>" +
                "<div style='display:flex;align-items:center;gap:8px;'>" +
                    "<span style='font-size:18px'>" + c.icon + "</span>" +
                    "<div>" +
                        "<div style='font-weight:700;font-size:14px;color:#111;'>" + escapeHTML(analysis.category) + "</div>" +
                        "<div style='font-size:11px;color:#555;'>ScamSathi MailGuard · " + PLATFORM.toUpperCase() + "</div>" +
                    "</div>" +
                "</div>" +
                "<div style='display:flex;align-items:center;gap:8px;'>" +
                    "<span style='background:" + c.badge + ";color:#fff;padding:2px 10px;border-radius:12px;font-weight:700;font-size:12px;'>" +
                        analysis.score + "/100 · " + analysis.risk.toUpperCase() +
                    "</span>" +
                    "<button id='scamsathi-dismiss-btn' type='button' style='background:none;border:none;font-size:16px;cursor:pointer;color:#888;padding:0 4px;' title='Dismiss'>✕</button>" +
                "</div>" +
            "</div>" +
            "<div style='color:#333;'>" + escapeHTML(analysis.explanation) + "</div>" +
            signalsHtml + actionsHtml;

        div.querySelector("#scamsathi-dismiss-btn").addEventListener("click", function () { div.remove(); });
        return div;
    }

    function escapeHTML(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // ── core scan ─────────────────────────────────────────────────────────────

    function tryAutoScan() {
        var analyzer = window.MailGuardAnalyzer;
        if (!analyzer) {
            console.warn("[ScamSathi][" + PLATFORM + "] MailGuardAnalyzer not loaded.");
            // Fallback: try old ScamSathiDetector
            analyzer = null;
        }

        var emailData = extractEmailData();
        if (!emailData) return;

        // Fingerprint check: skip if same email as last scan
        var fp = fingerprint(emailData.subject, emailData.senderEmail || emailData.subject);
        if (fp === lastFingerprint) {
            console.log("[ScamSathi][" + PLATFORM + "] Same email as last scan — skipping duplicate.");
            return;
        }
        lastFingerprint = fp;

        // Run analysis
        var analysis;
        try {
            if (analyzer) {
                analysis = analyzer.analyze(emailData);
            } else if (window.ScamSathiDetector) {
                // Fallback to existing WhatsApp detector for basic scoring
                var combinedText = emailData.subject + "\n" + emailData.body;
                var r = window.ScamSathiDetector.evaluateMessageHeuristics(combinedText);
                analysis = {
                    score:       r.score,
                    risk:        r.score >= 80 ? "critical" : r.score >= 60 ? "high" : r.score >= 30 ? "suspicious" : "low",
                    category:    r.category,
                    signals:     r.signals || [],
                    urlFindings: [],
                    senderAnalysis: { trusted: false, domain: "unknown", reason: "" },
                    explanation: r.explanation || "",
                    actions:     r.actions || []
                };
            } else {
                console.warn("[ScamSathi][" + PLATFORM + "] No analysis engine available.");
                return;
            }
        } catch (err) {
            console.error("[ScamSathi][" + PLATFORM + "] Analysis error:", err);
            return;
        }

        console.log("[ScamSathi][" + PLATFORM + "] Analysis complete | score:", analysis.score, "| risk:", analysis.risk);
        injectBanner(analysis, emailData);
    }

    // ── manual scan button ────────────────────────────────────────────────────

    function injectManualButton() {
        if (document.getElementById("scamsathi-manual-btn")) return;

        var anchors = IS_GMAIL
            ? [".hP", "h2.hP", "div[role='main'] h2", ".Bu"]
            : ["[data-testid='subject']", "h1[role='heading']", ".Subject"];

        var anchor = firstMatch(anchors);
        if (!anchor) return;

        var btn = document.createElement("button");
        btn.id = "scamsathi-manual-btn";
        btn.type = "button";
        btn.title = "Manually scan this email with ScamSathi";
        btn.style.cssText = [
            "display:inline-flex", "align-items:center", "gap:5px",
            "background:#0f172a", "color:#06b6d4",
            "border:1px solid rgba(6,182,212,0.4)", "padding:3px 10px",
            "border-radius:12px", "font-size:11.5px", "font-weight:700",
            "cursor:pointer", "margin-left:10px", "vertical-align:middle",
            "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
            "transition:all 0.2s"
        ].join(";");
        btn.textContent = "🛡️ Scan Email";

        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            lastFingerprint = ""; // Force rescan
            tryAutoScan();
        });

        // Insert after the subject heading
        if (anchor.parentNode) {
            anchor.parentNode.insertBefore(btn, anchor.nextSibling);
        }
    }

    // ── MutationObserver + debounce ───────────────────────────────────────────

    var observer = new MutationObserver(function (mutations) {
        var relevant = false;
        for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
                var node = added[j];
                if (node.nodeType !== 1) continue;
                // Ignore ScamSathi's own injected elements
                if (node.id === BANNER_ID || node.id === "scamsathi-manual-btn") continue;
                relevant = true;
                break;
            }
            if (relevant) break;
        }
        if (!relevant) return;

        if (scanTimer) clearTimeout(scanTimer);
        scanTimer = setTimeout(function () {
            injectManualButton();
            tryAutoScan();
        }, 600);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // ── initial sweeps ────────────────────────────────────────────────────────
    // Staggered to handle Gmail's slow SPA rendering

    setTimeout(function () { injectManualButton(); tryAutoScan(); }, 1500);
    setTimeout(function () { injectManualButton(); tryAutoScan(); }, 3000);
    setTimeout(function () { injectManualButton(); tryAutoScan(); }, 6000);

})();
