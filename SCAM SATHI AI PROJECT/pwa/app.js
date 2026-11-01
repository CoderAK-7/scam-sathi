// @ts-nocheck
/**
 * ScamSathi AI — Mobile PWA App Controller
 * Manages views, heuristics via ScamSathiCoreEngine, Android Share Target, and History
 */

(function () {
    "use strict";

    var deferredInstallPrompt = null;
    var historyStorageKey = "scamsathi_mobile_history";

    // ── Pre-set demonstration fixtures ─────────────────────────────────────────
    var PRESETS = {
        msg: {
            bijli: "Dear Customer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately contact power officer Sharma at 9812345678 and update bill via http://bijli-update.apk immediately.",
            upi: "Congratulations! You received cashback reward Rs 5,000 from PhonePe. Scan QR code or visit http://reward-claim.online and enter your 6-digit UPI PIN to credit your bank account.",
            arrest: "CBI Cyber Crime Notice: Your Aadhaar linked mobile number was detected in money laundering parcel from Mumbai customs. You are under Digital Arrest. Join Skype video call immediately or police warrant issued.",
            safe: "Dear Customer, INR 1,500.00 debited from A/c XX4821 on 31-OCT at HDFC ATM. Available balance INR 24,820.50. If not done by you, SMS BLOCK to 56767."
        },
        email: {
            kyc: {
                subject: "URGENT: Your SBI Account is Suspended — KYC Update Required",
                senderName: "State Bank of India Security",
                senderEmail: "support-sbi@secure-banking-alert.top",
                body: "Dear Customer, your internet banking has been suspended due to expired PAN KYC. Verify your identity within 24 hours at http://sbi-kyc-verify.top/login.php or account permanently locked."
            },
            lottery: {
                subject: "Congratulations! Claim Your Rs 85,00,000 Lottery Award",
                senderName: "National Prize Directorate",
                senderEmail: "director@lottery-winner-india.gdn",
                body: "Your email was chosen in National Digital Lucky Draw. To receive prize transfer, deposit refundable clearance fee of Rs 4,999 to account 9876543210 immediately."
            },
            job: {
                subject: "Urgent Hiring: Part-Time YouTube Reviewer — Earn Rs 2,500 Daily",
                senderName: "Global HR Services",
                senderEmail: "hr@workfromhome-earning.xyz",
                body: "Earn unlimited daily income by liking videos. No experience required. Work 1 hour per day from home. Join Telegram channel @daily_earnings_now to begin."
            }
        },
        sms: {
            challan: {
                sender: "+919876543210",
                text: "Parivahan e-Challan Notice: Fine of Rs 1,000 pending on vehicle DL-01-AB-1234. Pay immediately or arrest warrant issued. Download official challan app: http://echallan-pay.apk"
            },
            sim: {
                sender: "9823456789",
                text: "Dear Airtel user, your SIM card will be deactivated in 24 hours due to non-KYC. Immediately send 1900 SMS or call 9823456789 to prevent permanent disconnect."
            },
            pan: {
                sender: "VM-SBIINB",
                text: "Dear SBI User, your A/c XX1234 PAN link pending. Update at our official portal onlinesbi.sbi or visit your home branch. Do not share OTP."
            }
        }
    };

    // ── DOM References ──
    var views = document.querySelectorAll(".view-panel");
    var navItems = document.querySelectorAll(".nav-item");
    var installBtn = document.getElementById("installPwaBtn");
    var chkDarkTheme = document.getElementById("chkDarkTheme");

    // ── View Switching ──
    function switchView(targetId) {
        views.forEach(function (v) {
            v.classList.remove("active");
        });
        navItems.forEach(function (n) {
            n.classList.remove("active");
            if (n.dataset.nav === targetId) {
                n.classList.add("active");
            }
        });

        var targetEl = document.getElementById(targetId);
        if (targetEl) {
            targetEl.classList.add("active");
            document.getElementById("mainContainer").scrollTop = 0;
        }
    }

    // Attach bottom navigation listeners
    navItems.forEach(function (btn) {
        btn.addEventListener("click", function () {
            switchView(btn.dataset.nav);
        });
    });

    // Attach quick action cards listeners
    document.querySelectorAll("[data-switch-view]").forEach(function (card) {
        card.addEventListener("click", function () {
            switchView(card.dataset.switchView);
        });
    });

    // ── Service Worker Registration ──
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
            navigator.serviceWorker.register("./sw.js").then(function (reg) {
                console.log("[ScamSathi PWA] Service Worker registered with scope:", reg.scope);
            }).catch(function (err) {
                console.warn("[ScamSathi PWA] Service worker registration failed:", err);
            });
        });
    }

    // ── PWA Installation Prompt (Add to Home Screen) ──
    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        deferredInstallPrompt = e;
        if (installBtn) {
            installBtn.style.display = "inline-flex";
            installBtn.addEventListener("click", function () {
                if (deferredInstallPrompt) {
                    deferredInstallPrompt.prompt();
                    deferredInstallPrompt.userChoice.then(function (choice) {
                        console.log("[ScamSathi PWA] User install choice:", choice.outcome);
                        deferredInstallPrompt = null;
                        installBtn.style.display = "none";
                    });
                }
            });
        }
    });

    // ── Android Web Share Target Handler ──
    function handleIncomingShareTarget() {
        var params = new URLSearchParams(window.location.search);
        var sharedText = params.get("text") || params.get("title") || "";
        var sharedUrl = params.get("url") || "";
        var combined = (sharedText + " " + sharedUrl).trim();

        if (combined.length > 0) {
            console.log("[ScamSathi PWA] Received shared content via Android Share Target:", combined.slice(0, 50));
            // Switch to message scan view and auto-populate
            switchView("view-scan-message");
            var input = document.getElementById("messageTextInput");
            if (input) {
                input.value = combined;
                executeMessageScan(combined);
            }
        }
    }

    // ── Heuristic Scanning Wrappers ──

    function renderVerdict(container, verdict) {
        container.style.display = "block";
        container.className = "scan-verdict-box " + verdict.risk;

        var signalsHtml = "";
        if (verdict.signals && verdict.signals.length > 0) {
            signalsHtml = '<div class="verdict-signals"><strong>⚡ Detected Threats (' + verdict.signals.length + '):</strong>';
            verdict.signals.forEach(function (s) {
                signalsHtml += '<div class="verdict-signal-item"><span>•</span><div><strong>' + escapeHTML(s.name) + ':</strong> ' + escapeHTML(s.sub) + '</div></div>';
            });
            signalsHtml += '</div>';
        }

        var actionsHtml = "";
        if (verdict.actions && verdict.actions.length > 0) {
            actionsHtml = '<div class="verdict-actions-box"><strong>🛡️ Recommended Safety Action:</strong><br>' + 
                          escapeHTML(verdict.actions[0]) + '<br><small>Emergency Helpline: <strong>Dial 1930</strong></small></div>';
        }

        container.innerHTML = 
            '<div class="verdict-header">' +
                '<span class="verdict-badge" style="color:' + verdict.color + ';">' + escapeHTML(verdict.badgeText) + '</span>' +
                '<span class="verdict-score" style="color:' + verdict.color + ';">' + verdict.score + '/100</span>' +
            '</div>' +
            '<div class="verdict-category">' + escapeHTML(verdict.category) + '</div>' +
            '<div class="verdict-explanation">' + escapeHTML(verdict.explanation) + '</div>' +
            signalsHtml + actionsHtml;

        // Save to History
        saveHistoryItem({
            category: verdict.category,
            platform: verdict.platform,
            score: verdict.score,
            risk: verdict.risk,
            color: verdict.color,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
        });
    }

    function executeMessageScan(text) {
        if (!text || text.trim().length < 4) {
            alert("Please paste or type a message to inspect.");
            return;
        }
        var engine = window.ScamSathiCoreEngine;
        if (!engine) {
            alert("Security engine initializing. Please try again.");
            return;
        }

        var verdict = engine.scan(text, "whatsapp");
        var container = document.getElementById("msgVerdictBox");
        renderVerdict(container, verdict);
    }

    function executeEmailScan(emailObj) {
        var engine = window.ScamSathiCoreEngine;
        if (!engine) return;

        var verdict = engine.scan(emailObj, "email");
        var container = document.getElementById("emailVerdictBox");
        renderVerdict(container, verdict);
    }

    function executeSmsScan(smsText, sender) {
        if (!smsText || smsText.trim().length < 4) {
            alert("Please enter the SMS message content.");
            return;
        }
        var engine = window.ScamSathiCoreEngine;
        if (!engine) return;

        var verdict = engine.SMSDetector.analyze(smsText, sender);
        var norm = engine.ScamRiskScorer.computeVerdict(verdict.score, verdict.signals, "sms");
        var container = document.getElementById("smsVerdictBox");
        renderVerdict(container, norm);
    }

    // ── Local History & Metric Counters ──

    function getHistory() {
        try {
            var raw = localStorage.getItem(historyStorageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (_) {
            return [];
        }
    }

    function saveHistoryItem(item) {
        var list = getHistory();
        list.unshift(item);
        if (list.length > 50) list.pop(); // keep last 50
        try {
            localStorage.setItem(historyStorageKey, JSON.stringify(list));
        } catch (_) {}
        refreshHistoryUI();
        refreshMetrics();
    }

    function refreshHistoryUI() {
        var container = document.getElementById("historyItemsContainer");
        if (!container) return;

        var items = getHistory();
        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:30px 10px;">No scan history yet. Scan messages, emails or SMS to see records here.</div>';
            return;
        }

        var html = "";
        items.forEach(function (it) {
            html += 
                '<div class="history-item">' +
                    '<div class="history-item-left">' +
                        '<strong>' + escapeHTML(it.category) + '</strong>' +
                        '<span>' + it.platform.toUpperCase() + ' · ' + it.date + '</span>' +
                    '</div>' +
                    '<span class="history-score-pill" style="background:' + it.color + '22;color:' + it.color + ';border:1px solid ' + it.color + ';">' + 
                        it.score + '/100' +
                    '</span>' +
                '</div>';
        });
        container.innerHTML = html;
    }

    function refreshMetrics() {
        var items = getHistory();
        var total = items.length;
        var high = items.filter(function (i) { return i.score >= 60; }).length;
        var review = items.filter(function (i) { return i.score >= 30 && i.score < 60; }).length;
        var safe = items.filter(function (i) { return i.score < 30; }).length;

        var elTotal = document.getElementById("statTotalScans");
        var elHigh = document.getElementById("statHighThreats");
        var elRev = document.getElementById("statReviewAlerts");
        var elSafe = document.getElementById("statSafePass");

        if (elTotal) elTotal.textContent = total;
        if (elHigh) elHigh.textContent = high;
        if (elRev) elRev.textContent = review;
        if (elSafe) elSafe.textContent = safe;
    }

    // ── Button & Preset Event Handlers ──

    // 1. Message Scan
    document.getElementById("btnRunMsgScan")?.addEventListener("click", function () {
        var val = document.getElementById("messageTextInput").value;
        executeMessageScan(val);
    });

    document.getElementById("btnPasteMsg")?.addEventListener("click", async function () {
        try {
            var text = await navigator.clipboard.readText();
            document.getElementById("messageTextInput").value = text;
        } catch (_) {
            alert("Clipboard permission unavailable. Please paste manually into the text area.");
        }
    });

    document.getElementById("btnClearMsg")?.addEventListener("click", function () {
        document.getElementById("messageTextInput").value = "";
        document.getElementById("msgVerdictBox").style.display = "none";
    });

    document.querySelectorAll("[data-msg-preset]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var key = btn.dataset.msgPreset;
            if (PRESETS.msg[key]) {
                document.getElementById("messageTextInput").value = PRESETS.msg[key];
            }
        });
    });

    // 2. Email Scan
    document.getElementById("btnRunEmailScan")?.addEventListener("click", function () {
        var obj = {
            subject: document.getElementById("emailSubjectInput").value,
            senderName: document.getElementById("emailSenderNameInput").value,
            senderEmail: document.getElementById("emailSenderAddrInput").value,
            body: document.getElementById("emailBodyInput").value,
            links: []
        };
        executeEmailScan(obj);
    });

    document.querySelectorAll("[data-email-preset]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var key = btn.dataset.emailPreset;
            var p = PRESETS.email[key];
            if (p) {
                document.getElementById("emailSubjectInput").value = p.subject;
                document.getElementById("emailSenderNameInput").value = p.senderName;
                document.getElementById("emailSenderAddrInput").value = p.senderEmail;
                document.getElementById("emailBodyInput").value = p.body;
            }
        });
    });

    // 3. SMS Scan
    document.getElementById("btnRunSmsScan")?.addEventListener("click", function () {
        var text = document.getElementById("smsBodyInput").value;
        var header = document.getElementById("smsSenderHeaderInput").value;
        executeSmsScan(text, header);
    });

    document.querySelectorAll("[data-sms-preset]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var key = btn.dataset.smsPreset;
            var p = PRESETS.sms[key];
            if (p) {
                document.getElementById("smsSenderHeaderInput").value = p.sender;
                document.getElementById("smsBodyInput").value = p.text;
            }
        });
    });

    // 4. WhatsApp Quick Paste Button
    document.getElementById("btnWhatsAppQuickPaste")?.addEventListener("click", async function () {
        switchView("view-scan-message");
        try {
            var text = await navigator.clipboard.readText();
            document.getElementById("messageTextInput").value = text;
            executeMessageScan(text);
        } catch (_) {
            document.getElementById("messageTextInput").focus();
        }
    });

    // 5. Clear History
    document.getElementById("btnClearHistory")?.addEventListener("click", function () {
        if (confirm("Clear all locally recorded scan logs?")) {
            localStorage.removeItem(historyStorageKey);
            refreshHistoryUI();
            refreshMetrics();
        }
    });

    // 6. Settings: Dark Theme Toggle
    chkDarkTheme?.addEventListener("change", function () {
        if (chkDarkTheme.checked) {
            document.body.className = "theme-dark";
        } else {
            document.body.className = "theme-light";
        }
    });

    document.getElementById("openSettingsBtn")?.addEventListener("click", function () {
        switchView("view-settings");
    });

    // Utility
    function escapeHTML(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ── Initialize App ──
    refreshHistoryUI();
    refreshMetrics();
    handleIncomingShareTarget();

})();

