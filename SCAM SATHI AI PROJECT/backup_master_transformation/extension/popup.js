/**
 * ScamSathi Universal Scam Guardian - Popup Controller
 * Integrates local-first heuristics, bilingual switching, and manual scan workflows
 */

document.addEventListener("DOMContentLoaded", () => {
    let currentLang = "en"; // "en" | "hi"

    // Presets for quick hackathon demonstrations
    const MESSAGE_PRESETS = {
        bijli: "Dear Customer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill from previous month. Immediately contact our power officer Sharma on 9812345678 and update bill via http://bijli-update.apk immediately.",
        upi: "Congratulations! You have received a cashback reward of Rs 5,000 from PhonePe / GooglePay. Scan the QR code or click http://reward-claim.online and enter your 6-digit UPI PIN to credit money to your bank account.",
        kyc: "Dear SBI customer, your net banking account has been temporarily blocked due to expired KYC PAN document. Please update immediately at http://sbi-kyc-verification.top or your account will be permanently closed within 24 hours.",
        prize: "Congratulations! You have been selected as the winner of Rs 85,000 prize from Lucky Draw 2024. To claim your reward, a refundable processing fee of Rs 1,499 is required. Please send to account number 9876543210, IFSC HDFC0001234. Contact Mr Sharma at sharma.lucky@gmail.com.",
        safe: "Dear Customer, INR 1,450.00 debited from A/c XX4821 on 31-OCT at ATM HDFC. Available balance INR 24,820.50. If not done by you, SMS BLOCK to 56767."
    };

    const URL_PRESETS = {
        sbi_fake: "http://sbi-kyc-verification.top/login.php",
        apk: "http://192.168.1.104:8080/bijli-power-update.apk",
        legit: "https://www.onlinesbi.sbi"
    };

    // Bilingual strings
    const I18N = {
        en: {
            subTitle: "Universal Indian Cyber Threat Shield",
            tabMsg: "✉️ Message",
            tabUrl: "🔗 Link",
            tabSms: "📱 SMS Guide",
            tabStatus: "🛡️ Status",
            presetsTag: "⚡ Presets:",
            msgPlaceholder: "Paste SMS, WhatsApp forward, email body, or UPI message to inspect...",
            scanMsgBtn: "Scan Message with ScamSathi",
            urlDesc: "Inspect links from SMS, WhatsApp, and social media. Detects bank impersonation, APK downloads, and high-risk domains without opening them.",
            scanUrlBtn: "Inspect & Analyze Link",
            smsTitle: "SMS Scam Protection Protocol",
            smsNotice: "Why Manual Scan? Web browsers and Chrome Extensions are sandboxed and cannot directly access your Android phone's SMS inbox. Beware of any extension claiming automatic mobile SMS access without an external companion app.",
            stepsTitle: "How to safely scan an SMS:",
            step1: "1. Copy SMS: Long-press the suspicious text on your phone or web SMS client.",
            step2: "2. Paste in Message Tab: Switch to the Message tab above and click Paste.",
            step3: "3. Instant Verification: ScamSathi evaluates APK traps, UPI PIN demands, and fake bank notices locally.",
            switchBtn: "👉 Go to Message Scanner Now",
            verifiedSignals: "Verified Threat Signals",
            dangerExpl: "Why This Is Dangerous",
            prescribedActions: "Prescribed Safety Actions",
            noSignals: "No high-risk scam patterns detected in local heuristic pass."
        },
        hi: {
            subTitle: "भारतीय साइबर सुरक्षा एवं फ़िशिंग रक्षक",
            tabMsg: "✉️ संदेश जांच",
            tabUrl: "🔗 लिंक जांच",
            tabSms: "📱 एसएमएस गाइड",
            tabStatus: "🛡️ स्थिति",
            presetsTag: "⚡ नमूने:",
            msgPlaceholder: "जांचने के लिए एसएमएस, व्हाट्सएप संदेश, ईमेल या यूपीआई संदेश यहां पेस्ट करें...",
            scanMsgBtn: "स्कैमसाथी से संदेश की जांच करें",
            urlDesc: "संदिग्ध लिंक की जांच करें। बैंक प्रतिरूपण, एपीके मैलवेयर और जोखिम भरे डोमेन की सुरक्षित पहचान।",
            scanUrlBtn: "लिंक का विश्लेषण करें",
            smsTitle: "एसएमएस धोखाधड़ी सुरक्षा नियम",
            smsNotice: "मैनुअल जांच क्यों? वेब ब्राउज़र और एक्सटेंशन सीधे आपके फोन के एसएमएस इनबॉक्स को नहीं पढ़ सकते। किसी भी ऐसे दावे से सावधान रहें जो फोन एसएमएस सीधे पढ़ने का वादा करता हो।",
            stepsTitle: "संदिग्ध एसएमएस की सुरक्षित जांच कैसे करें:",
            step1: "1. एसएमएस कॉपी करें: अपने मोबाइल पर संदिग्ध मैसेज को कॉपी करें।",
            step2: "2. संदेश टैब में पेस्ट करें: ऊपर 'संदेश जांच' टैब में जाकर 'Paste' पर क्लिक करें।",
            step3: "3. तुरंत रिपोर्ट प्राप्त करें: स्कैमसाथी तुरंत यूपीआई पिन जाल और फर्जी बैंक अलर्ट की जांच करेगा।",
            switchBtn: "👉 अभी संदेश स्कैनर पर जाएं",
            verifiedSignals: "पहचाने गए खतरे के संकेत",
            dangerExpl: "यह खतरनाक क्यों है (विवरण)",
            prescribedActions: "नागरिक सुरक्षा सुझाव",
            noSignals: "लोकल हेयूरिस्टिक जांच में कोई गंभीर धोखाधड़ी संकेत नहीं मिले।"
        }
    };

    // DOM Elements
    const langEnBtn = document.getElementById("langEnBtn");
    const langHiBtn = document.getElementById("langHiBtn");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const messageInput = document.getElementById("messageInput");
    const msgCharCount = document.getElementById("msgCharCount");
    const pasteMsgBtn = document.getElementById("pasteMsgBtn");
    const clearMsgBtn = document.getElementById("clearMsgBtn");
    const scanMessageBtn = document.getElementById("scanMessageBtn");
    const messageResultBox = document.getElementById("messageResultBox");

    const urlInput = document.getElementById("urlInput");
    const clearUrlBtn = document.getElementById("clearUrlBtn");
    const scanUrlBtn = document.getElementById("scanUrlBtn");
    const urlResultBox = document.getElementById("urlResultBox");

    const switchToMsgTabBtn = document.getElementById("switchToMsgTabBtn");

    // =========================================================================
    // LANGUAGE SWITCHING
    // =========================================================================

    function setLanguage(lang) {
        currentLang = lang;
        langEnBtn.classList.toggle("active", lang === "en");
        langHiBtn.classList.toggle("active", lang === "hi");

        const t = I18N[lang];
        document.getElementById("headerSubtitle").textContent = t.subTitle;
        document.getElementById("tabMsgLabel").innerHTML = `<span>${t.tabMsg}</span>`;
        document.getElementById("tabUrlLabel").innerHTML = `<span>${t.tabUrl}</span>`;
        document.getElementById("tabSmsLabel").innerHTML = `<span>${t.tabSms}</span>`;
        document.getElementById("tabStatusLabel").innerHTML = `<span>${t.tabStatus}</span>`;
        document.getElementById("presetsTag").textContent = t.presetsTag;
        messageInput.placeholder = t.msgPlaceholder;
        document.getElementById("scanMsgBtnText").textContent = t.scanMsgBtn;
        document.getElementById("urlDescText").textContent = t.urlDesc;
        document.getElementById("scanUrlBtnText").textContent = t.scanUrlBtn;
        document.getElementById("smsGuideTitle").textContent = t.smsTitle;
        document.getElementById("smsNoticeText").innerHTML = `<strong>${lang === 'hi' ? 'मैनुअल जांच क्यों?' : 'Why Manual Scan?'}</strong> ${t.smsNotice}`;
        document.getElementById("guideStepsTitle").textContent = t.stepsTitle;
        document.getElementById("step1").innerHTML = t.step1;
        document.getElementById("step2").innerHTML = t.step2;
        document.getElementById("step3").innerHTML = t.step3;
        switchToMsgTabBtn.textContent = t.switchBtn;

        // If message result is already displayed, re-scan to re-render in chosen language
        if (!messageResultBox.classList.contains("hidden") && messageInput.value.trim()) {
            runMessageScan();
        }
    }

    langEnBtn.addEventListener("click", () => setLanguage("en"));
    langHiBtn.addEventListener("click", () => setLanguage("hi"));

    // =========================================================================
    // TABS
    // =========================================================================

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.tab;
            tabButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add("active");
        });
    });

    switchToMsgTabBtn.addEventListener("click", () => {
        const msgTabBtn = document.querySelector(".tab-btn[data-tab='tab-message']");
        if (msgTabBtn) msgTabBtn.click();
        messageInput.focus();
    });

    // =========================================================================
    // PRESETS
    // =========================================================================

    document.querySelectorAll(".chip[data-preset]").forEach(chip => {
        chip.addEventListener("click", () => {
            const key = chip.dataset.preset;
            if (MESSAGE_PRESETS[key]) {
                messageInput.value = MESSAGE_PRESETS[key];
                updateCharCount();
                runMessageScan();
            }
        });
    });

    document.querySelectorAll(".chip[data-url-preset]").forEach(chip => {
        chip.addEventListener("click", () => {
            const key = chip.dataset.urlPreset;
            if (URL_PRESETS[key]) {
                urlInput.value = URL_PRESETS[key];
                runUrlScan();
            }
        });
    });

    // =========================================================================
    // MESSAGE SCANNER
    // =========================================================================

    function updateCharCount() {
        const len = messageInput.value.length;
        msgCharCount.textContent = `${len} chars`;
    }

    messageInput.addEventListener("input", updateCharCount);

    pasteMsgBtn.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                messageInput.value = text;
                updateCharCount();
                runMessageScan();
            }
        } catch {
            messageInput.focus();
        }
    });

    clearMsgBtn.addEventListener("click", () => {
        messageInput.value = "";
        updateCharCount();
        messageResultBox.classList.add("hidden");
        messageResultBox.innerHTML = "";
    });

    scanMessageBtn.addEventListener("click", () => {
        runMessageScan();
    });

    function runMessageScan() {
        const text = messageInput.value.trim();
        if (!text) {
            messageInput.focus();
            return;
        }

        const detector = window.ScamSathiDetector;
        if (!detector) return;

        const analysis = detector.evaluateMessageHeuristics(text, currentLang);
        renderMessageResult(analysis);
    }

    function renderMessageResult(analysis) {
        const t = I18N[currentLang];
        const isHigh = analysis.score >= 60;
        const isReview = analysis.score >= 30 && analysis.score < 60;
        const riskClass = isHigh ? "high" : (isReview ? "review" : "safe");
        const borderClass = isHigh ? "high-border" : (isReview ? "review-border" : "safe-border");

        messageResultBox.className = `result-box ${borderClass}`;
        messageResultBox.innerHTML = `
            <div class="result-top-row">
                <span class="verdict-badge ${riskClass}">${analysis.status}</span>
                <div class="score-display">
                    <span class="score-num">${analysis.score}</span>
                    <span class="score-max">/ 100</span>
                </div>
            </div>

            <div class="result-cat-title">${escapeHTML(analysis.category)}</div>

            <!-- Threat Signals -->
            <div class="res-box-sec">
                <div class="res-sec-label">⚡ ${t.verifiedSignals} (${analysis.signals.length})</div>
                <div class="signal-list">
                    ${analysis.signals.length > 0 ? analysis.signals.map(s => `
                        <div class="signal-row ${s.weight >= 30 ? 'high-sig' : 'review-sig'}">
                            <div>
                                <div class="sig-name">${escapeHTML(s.name)}</div>
                                <div class="sig-sub">${escapeHTML(s.sub)}</div>
                            </div>
                            <span class="sig-weight ${s.weight >= 30 ? 'high' : 'review'}">+${s.weight}</span>
                        </div>
                    `).join("") : `
                        <div class="sig-sub">${t.noSignals}</div>
                    `}
                </div>
            </div>

            <!-- Danger Explanation -->
            <div class="res-box-sec">
                <div class="res-sec-label">🔍 ${t.dangerExpl}</div>
                <div class="res-explanation-text">${escapeHTML(analysis.explanation)}</div>
            </div>

            <!-- Prescribed Actions -->
            <div class="res-box-sec">
                <div class="res-sec-label">🛡️ ${t.prescribedActions}</div>
                <div class="action-items">
                    ${analysis.actions.map(act => `
                        <div class="action-row">
                            <span class="action-dot">•</span>
                            <span>${escapeHTML(act)}</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;

        messageResultBox.classList.remove("hidden");
    }

    // =========================================================================
    // URL SCANNER
    // =========================================================================

    clearUrlBtn.addEventListener("click", () => {
        urlInput.value = "";
        urlResultBox.classList.add("hidden");
        urlResultBox.innerHTML = "";
    });

    scanUrlBtn.addEventListener("click", () => {
        runUrlScan();
    });

    urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") runUrlScan();
    });

    function runUrlScan() {
        const rawUrl = urlInput.value.trim();
        if (!rawUrl) {
            urlInput.focus();
            return;
        }

        const detector = window.ScamSathiDetector;
        if (!detector) return;

        const analysis = detector.evaluateUrlHeuristics(rawUrl);
        renderUrlResult(analysis);
    }

    function renderUrlResult(analysis) {
        const t = I18N[currentLang];
        const isHigh = analysis.score >= 60;
        const isReview = analysis.score >= 30 && analysis.score < 60;
        const riskClass = isHigh ? "high" : (isReview ? "review" : "safe");
        const borderClass = isHigh ? "high-border" : (isReview ? "review-border" : "safe-border");

        urlResultBox.className = `result-box ${borderClass}`;
        urlResultBox.innerHTML = `
            <div class="result-top-row">
                <span class="verdict-badge ${riskClass}">${analysis.status}</span>
                <div class="score-display">
                    <span class="score-num">${analysis.score}</span>
                    <span class="score-max">/ 100</span>
                </div>
            </div>

            <div class="result-cat-title">${escapeHTML(analysis.category)} (${escapeHTML(analysis.hostname || 'Direct Host')})</div>

            <div class="res-box-sec">
                <div class="res-sec-label">⚡ ${t.verifiedSignals} (${analysis.signals.length})</div>
                <div class="signal-list">
                    ${analysis.signals.length > 0 ? analysis.signals.map(s => `
                        <div class="signal-row ${s.weight >= 30 ? 'high-sig' : 'review-sig'}">
                            <div>
                                <div class="sig-name">${escapeHTML(s.name)}</div>
                                <div class="sig-sub">${escapeHTML(s.sub)}</div>
                            </div>
                            <span class="sig-weight ${s.weight >= 30 ? 'high' : 'review'}">+${s.weight}</span>
                        </div>
                    `).join("") : `
                        <div class="sig-sub">No known brand spoofing or high-risk TLDs detected.</div>
                    `}
                </div>
            </div>

            <div class="res-box-sec">
                <div class="res-sec-label">🔍 ${t.dangerExpl}</div>
                <div class="res-explanation-text">${escapeHTML(analysis.explanation)}</div>
            </div>

            <div class="res-box-sec">
                <div class="res-sec-label">🛡️ ${t.prescribedActions}</div>
                <div class="action-items">
                    ${analysis.actions.map(act => `
                        <div class="action-row">
                            <span class="action-dot">•</span>
                            <span>${escapeHTML(act)}</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;

        urlResultBox.classList.remove("hidden");
    }

    // =========================================================================
    // ACTIVE TAB CONTEXT CHECK (Gmail & WhatsApp)
    // =========================================================================

    if (chrome && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url) {
                const url = tabs[0].url;
                const gmailBadge = document.getElementById("gmailBadge");
                const waBadge = document.getElementById("waBadge");

                if (url.includes("mail.google.com")) {
                    gmailBadge.textContent = "On Tab";
                    gmailBadge.className = "status-pill active";
                }
                if (url.includes("web.whatsapp.com")) {
                    waBadge.textContent = "On Tab";
                    waBadge.className = "status-pill active";
                }
            }
        });
    }

    // Open MailGuard Web App
    const openMailguardBtn = document.getElementById("openMailguardApp");
    if (openMailguardBtn) {
        openMailguardBtn.addEventListener("click", () => {
            if (chrome && chrome.tabs && chrome.tabs.create) {
                chrome.tabs.create({ url: chrome.runtime.getURL("mailguard/mailguard.html") });
            } else {
                window.open("mailguard/mailguard.html", "_blank");
            }
        });
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
});

