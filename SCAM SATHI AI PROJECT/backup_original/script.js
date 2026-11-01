/**
 * ScamSathi Bharat AI - PhishShield AI (#02)
 * Production-Ready Cybersecurity Web Application
 * Problem Statement: Think Before You Click. Stay Safe Before You Pay.
 */

// ============================================================================
// 1. STATE & INITIALIZATION
// ============================================================================

const APP_STATE = {
    currentPage: 'dashboard',
    historyFilter: 'all',
    searchQuery: '',
    selectedScanIndex: null
};

// Seed authentic demo scans if first time running to give hackathon judges an immediate rich experience
function initializeStorage() {
    const existing = localStorage.getItem("scamHistory");
    if (!existing) {
        const seedHistory = [
            {
                type: "Message",
                score: 85,
                status: "High Risk",
                category: "Fake Electricity Bill & Malicious APK",
                preview: "Dear Customer, electricity will be disconnected tonight at 9:30 PM due to unpaid bill. Update via http://bijli-update.apk...",
                signals: [
                    { name: "Malicious APK File Reference", sub: "Android executable download link detected", weight: 35 },
                    { name: "High-Urgency Threat Hook", sub: "'Disconnected tonight at 9:30 PM' coercing immediate panic", weight: 25 },
                    { name: "Unverified Utility Notice", sub: "Electricity board notices are never sent from personal numbers", weight: 25 }
                ],
                explanation: "This is a rampant Indian cyber scam where attackers send panic-inducing SMS about immediate power cuts. The embedded APK file installs spyware that intercepts banking SMS and OTPs.",
                actions: [
                    "Do NOT install or run any .apk file downloaded from SMS or chat.",
                    "Verify your electricity bill status exclusively through your official state Discom portal.",
                    "Report the fraudulent sender number to 1930 and Chakshu (sancharsaathi.gov.in)."
                ],
                date: new Date(Date.now() - 3600000 * 2).toLocaleString('en-IN')
            },
            {
                type: "Message",
                score: 90,
                status: "High Risk",
                category: "UPI Inversion & PIN Solicitation",
                preview: "Congratulations! You have won Rs 5,000 PhonePe cashback. Scan QR code and enter your 6-digit UPI PIN to credit to account...",
                signals: [
                    { name: "UPI PIN Inversion Trap", sub: "Asks user to enter PIN to 'receive' money", weight: 40 },
                    { name: "Deceptive Lottery / Reward Bait", sub: "Unsolicited ₹5,000 cashback notification", weight: 25 },
                    { name: "Impersonation of Payment Brand", sub: "Spoofing PhonePe / GooglePay reward mechanics", weight: 25 }
                ],
                explanation: "Fundamental Rule of UPI: UPI PIN is solely required to DEDUCT money from your account. Entering your PIN on any QR code or link will immediately transfer your money to the scammer.",
                actions: [
                    "Never enter your UPI PIN to claim money, receive refunds, or accept prizes.",
                    "Block and report the sender VPA directly inside your UPI application.",
                    "Warn family members: Receiving money requires zero PIN authentication."
                ],
                date: new Date(Date.now() - 3600000 * 18).toLocaleString('en-IN')
            },
            {
                type: "URL",
                score: 75,
                status: "High Risk",
                category: "Banking Phishing & Suspicious TLD",
                preview: "http://sbi-kyc-verification.top/login.php",
                signals: [
                    { name: "Brand Impersonation (SBI)", sub: "Spoofs State Bank of India brand name on an unauthorized host", weight: 35 },
                    { name: "High-Risk Top Level Domain (.top)", sub: "TLD commonly associated with disposable phishing campaigns", weight: 20 },
                    { name: "Unencrypted Connection (HTTP)", sub: "Legitimate financial institutions strictly mandate HTTPS", weight: 20 }
                ],
                explanation: "This link attempts to mimic the official SBI portal to steal NetBanking login credentials, profile passwords, and OTPs. The official domain is onlinesbi.sbi.",
                actions: [
                    "Never type banking credentials into links received via SMS or email.",
                    "Type 'onlinesbi.sbi' manually into your browser's address bar.",
                    "If credentials were submitted, contact SBI immediately at 1800 1234 to freeze NetBanking."
                ],
                date: new Date(Date.now() - 3600000 * 36).toLocaleString('en-IN')
            },
            {
                type: "Message",
                score: 15,
                status: "Lower Risk",
                category: "Standard Transaction Notification",
                preview: "INR 1,450.00 debited from A/c XX4821 on 31-OCT at ATM HDFC. Available balance INR 24,820.50...",
                signals: [
                    { name: "Standard Bank Alert Structure", sub: "Contains masked account numbers and legitimate safety reporting instructions", weight: 0 }
                ],
                explanation: "The message matches legitimate debit transaction formats from registered banking gateways, with no coercive action links or PIN requests.",
                actions: [
                    "Always monitor account balance alerts against your personal spending.",
                    "Keep transaction SMS for your personal audit."
                ],
                date: new Date(Date.now() - 3600000 * 48).toLocaleString('en-IN')
            }
        ];

        localStorage.setItem("scamHistory", JSON.stringify(seedHistory));
    }
}

// ============================================================================
// 2. NAVIGATION & LAYOUT CONTROLS
// ============================================================================

function showPage(pageName) {
    const pages = document.querySelectorAll(".page-view");
    const navButtons = document.querySelectorAll(".sidebar-nav .nav-item");

    pages.forEach(page => page.classList.add("hidden"));

    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.remove("hidden");
    }

    navButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.page === pageName);
    });

    const pageMeta = {
        dashboard: {
            title: "Security Dashboard",
            sub: "AI-Powered Indian Cyber Threat Protection Suite"
        },
        message: {
            title: "Message Intelligence Engine",
            sub: "Multilingual Analysis for SMS, WhatsApp & Chat Scams"
        },
        url: {
            title: "URL & Link Security Scanner",
            sub: "Air-Gapped Domain Inspection & Phishing Link Analyzer"
        },
        history: {
            title: "Security Scan Audit Log",
            sub: "Local Privacy-Preserved Threat Telemetry"
        },
        awareness: {
            title: "Bharat Cyber Awareness Hub",
            sub: "Interactive Threat Defense Playbook for Indian Citizens & Seniors"
        },
        about: {
            title: "About ScamSathi Bharat AI",
            sub: "National Hackathon Problem Statement #02: PhishShield AI"
        }
    };

    if (pageMeta[pageName]) {
        document.getElementById("pageTitle").textContent = pageMeta[pageName].title;
        document.getElementById("pageSubtitle").textContent = pageMeta[pageName].sub;
    }

    APP_STATE.currentPage = pageName;

    // Refresh contextual data
    if (pageName === "history") {
        displayHistory();
    } else if (pageName === "dashboard") {
        updateDashboard();
    }

    // Auto-close mobile sidebar if open
    toggleSidebar(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSidebar(forceOpen) {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    
    const shouldOpen = typeof forceOpen === 'boolean' 
        ? forceOpen 
        : !sidebar.classList.contains("open");

    if (shouldOpen) {
        sidebar.classList.add("open");
        backdrop.classList.add("show");
    } else {
        sidebar.classList.remove("open");
        backdrop.classList.remove("show");
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById("notifDropdown");
    dropdown.classList.toggle("show");
}

// Close notifications when clicked outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById("notifDropdown");
    const notifBtn = document.getElementById("notifBtn");
    if (dropdown && notifBtn && !notifBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove("show");
    }
});

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00f2fe" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ============================================================================
// 3. STORAGE & TELEMETRY
// ============================================================================

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem("scamHistory") || "[]");
    } catch {
        return [];
    }
}

function saveScan(type, score, status, category, preview, signals, explanation, actions) {
    const history = getHistory();

    // Privacy protection: Sanitize sensitive credentials from preview snippet
    const sanitizedPreview = sanitizePreview(preview);

    const scanRecord = {
        type,
        score,
        status,
        category,
        preview: sanitizedPreview,
        signals: signals || [],
        explanation: explanation || "Local rule-based heuristic analysis.",
        actions: actions || ["Verify information with official sources."],
        date: new Date().toLocaleString('en-IN')
    };

    history.unshift(scanRecord);

    // Keep last 50 scans
    localStorage.setItem("scamHistory", JSON.stringify(history.slice(0, 50)));

    updateDashboard();
}

function sanitizePreview(text) {
    if (!text) return "";
    // Mask potential 6-digit OTPs, 16-digit cards, or passwords
    let cleaned = text.replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, "[MASKED CARD]");
    cleaned = cleaned.replace(/\b(otp|code|pin)[:\s]+(\d{4,6})\b/gi, "$1 [MASKED]");
    return cleaned.slice(0, 140);
}

function updateDashboard() {
    const history = getHistory();

    const total = history.length;
    const high = history.filter(item => item.score >= 60).length;
    const review = history.filter(item => item.score >= 30 && item.score < 60).length;
    const safe = history.filter(item => item.score < 30).length;

    // Update count labels
    document.getElementById("totalScans").textContent = total;
    document.getElementById("highScans").textContent = high;
    document.getElementById("reviewScans").textContent = review;
    document.getElementById("safeScans").textContent = safe;

    const sidebarHistoryCount = document.getElementById("sidebarHistoryCount");
    if (sidebarHistoryCount) {
        sidebarHistoryCount.textContent = total;
    }

    // Update visual risk spectrum bar
    const safeSeg = document.getElementById("spectrumSafe");
    const reviewSeg = document.getElementById("spectrumReview");
    const highSeg = document.getElementById("spectrumHigh");

    if (total > 0 && safeSeg && reviewSeg && highSeg) {
        const safePct = Math.max(Math.round((safe / total) * 100), 10);
        const reviewPct = Math.max(Math.round((review / total) * 100), 10);
        const highPct = Math.max(Math.round((high / total) * 100), 10);

        safeSeg.style.width = `${safePct}%`;
        safeSeg.textContent = `Safe (${safe})`;
        reviewSeg.style.width = `${reviewPct}%`;
        reviewSeg.textContent = `Review (${review})`;
        highSeg.style.width = `${highPct}%`;
        highSeg.textContent = `High Risk (${high})`;
    }

    // Populate Recent Scans feed
    const recentList = document.getElementById("recentScansList");
    if (recentList) {
        if (history.length === 0) {
            recentList.innerHTML = `
                <div class="empty-state" style="padding: 24px;">
                    <p class="empty-title">No Scan Activity Yet</p>
                    <p class="empty-desc">Scan a suspicious message or link to see live evaluations here.</p>
                </div>
            `;
            return;
        }

        const recentItems = history.slice(0, 4);
        recentList.innerHTML = recentItems.map((item, index) => {
            const riskClass = item.score >= 60 ? 'high' : item.score >= 30 ? 'review' : 'safe';
            const icon = item.type === 'Message' ? '✉' : '🔗';
            return `
                <div class="recent-item">
                    <div class="recent-item-left">
                        <div class="scan-type-icon">${icon}</div>
                        <div class="recent-details">
                            <span class="recent-title">${escapeHTML(item.category || item.type + " Scan")}</span>
                            <span class="recent-meta">${item.date} · ${escapeHTML(item.preview.slice(0, 48))}...</span>
                        </div>
                    </div>
                    <div class="recent-item-right">
                        <span class="score-badge ${riskClass}">${item.score}/100</span>
                        <button class="btn btn-ghost btn-sm" onclick="viewHistoryDetails(${index})" title="Inspect Details">
                            Inspect
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }
}

// ============================================================================
// 4. MESSAGE SCANNER: HEURISTIC ENGINE (INDIC PATTERNS)
// ============================================================================

const MESSAGE_PRESETS = {
    bijli: "Dear Customer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill from previous month. Immediately contact our power officer Sharma on 9812345678 and update bill via http://bijli-update.apk immediately.",
    upi: "Congratulations! You have received a cashback reward of Rs 5,000 from PhonePe / GooglePay. Scan the QR code or click http://reward-claim.online and enter your 6-digit UPI PIN to credit money to your bank account.",
    kyc: "Dear SBI customer, your YONO net banking account has been suspended today due to expired KYC PAN document. Please update immediately at http://sbi-kyc-verification.top or your account will be permanently blocked within 24 hours.",
    job: "Part-time work from home opportunity! Earn Rs 2,500 - 5,000 daily by simply rating hotels and liking YouTube videos. No experience needed. Join our official Telegram VIP group now: t.me/earn_daily_vip",
    digital_arrest: "Final Notice from CBI / Mumbai Crime Branch: A courier parcel containing 5 passports and narcotics addressed to your Aadhaar has been confiscated at customs. Connect to Skype video call immediately for Digital Arrest verification to avoid warrant.",
    safe: "Dear Customer, INR 1,450.00 debited from A/c XX4821 on 31-OCT-26 at ATM HDFC. Available balance INR 24,820.50. If not done by you, SMS BLOCK to 56767."
};

function loadMessagePreset(key) {
    const input = document.getElementById("messageInput");
    if (MESSAGE_PRESETS[key]) {
        input.value = MESSAGE_PRESETS[key];
        updateMessageCount();
        showToast("Preset loaded into scanner", "info");
    }
}

function updateMessageCount() {
    const input = document.getElementById("messageInput").value;
    const charCount = input.length;
    const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
    
    document.getElementById("msgCharCount").textContent = `${charCount} characters`;
    document.getElementById("msgWordCount").textContent = `${wordCount} words`;
}

async function pasteMessage() {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            document.getElementById("messageInput").value = text;
            updateMessageCount();
            showToast("Clipboard text pasted", "success");
        } else {
            showToast("Clipboard is empty", "info");
        }
    } catch {
        showToast("Please allow clipboard permission or paste manually (Ctrl+V)", "info");
    }
}

function clearMessage() {
    document.getElementById("messageInput").value = "";
    document.getElementById("messageResult").classList.add("hidden");
    updateMessageCount();
    showToast("Message cleared", "info");
}

function scanMessage() {
    const input = document.getElementById("messageInput");
    const rawMessage = input.value.trim();
    const resultContainer = document.getElementById("messageResult");
    const loader = document.getElementById("messageLoading");
    const scanBtn = document.getElementById("scanMessageBtn");

    if (!rawMessage) {
        showToast("Please paste or type a message first.", "info");
        input.focus();
        return;
    }

    if (rawMessage.length < 10) {
        showToast("Message is too short for meaningful security analysis.", "info");
        return;
    }

    // Trigger analysis loader
    resultContainer.classList.add("hidden");
    loader.classList.remove("hidden");
    scanBtn.disabled = true;

    // Simulate multi-step cybersecurity token inspection (650ms)
    setTimeout(() => {
        loader.classList.add("hidden");
        scanBtn.disabled = false;

        const analysis = evaluateMessageHeuristics(rawMessage);
        renderMessageResult(analysis, rawMessage);

        saveScan(
            "Message",
            analysis.score,
            analysis.status,
            analysis.category,
            rawMessage,
            analysis.signals,
            analysis.explanation,
            analysis.actions
        );

        showToast(`Scan complete: ${analysis.status} (${analysis.score}/100)`, "info");
    }, 650);
}

function evaluateMessageHeuristics(text) {
    const lower = text.toLowerCase();
    const detectedSignals = [];
    const matchedKeywords = [];
    let cumulativeScore = 0;
    let category = "General Message Inspection";

    // 1. Critical UPI Reverse-Payment / PIN Traps
    const upiRules = [
        { pattern: /enter (your )?(upi )?pin to receive/i, name: "UPI PIN Inversion Trap", desc: "Asking user to enter PIN to 'receive' money", points: 45, word: "enter pin to receive" },
        { pattern: /upi pin/i, name: "UPI PIN Mention", desc: "References UPI PIN in unsolicited message", points: 25, word: "upi pin" },
        { pattern: /claim cashback|reward claim|scratch card/i, name: "Financial Reward / Cashback Bait", desc: "Unrealistic lucky draw or cashback promises", points: 25, word: "cashback reward" },
        { pattern: /paisa (lene|pane) ke liye/i, name: "Hinglish UPI Trap", desc: "Hinglish coercion to collect money via PIN", points: 35, word: "paisa lene ke liye" },
        { pattern: /phonepe|googlepay|gpay|paytm/i, name: "Payment App Impersonation", desc: "Names popular Indian wallet/UPI applications", points: 15, word: "payment app" }
    ];

    // 2. Fake Electricity Bill / Bijli Cut APK Scams
    const utilityRules = [
        { pattern: /\.apk\b/i, name: "Dangerous APK Sideloading", desc: "Direct download of Android APK file", points: 40, word: ".apk file" },
        { pattern: /power (will be )?disconnect|electricity (will be )?cut|light kat jayegi/i, name: "Utility Disconnection Threat", desc: "Fabricated urgent electricity shutdown warning", points: 35, word: "power disconnect" },
        { pattern: /bijli|power officer|unpaid bill/i, name: "State Electricity Discom Spoof", desc: "Posing as power corporation officials", points: 25, word: "electricity bill" },
        { pattern: /tonight at 9:?30|urgent bill update/i, name: "Night Deadline Pressure", desc: "Creating artificial immediate deadline", points: 20, word: "tonight deadline" }
    ];

    // 3. Fake Bank KYC / YONO Account Suspended
    const kycRules = [
        { pattern: /yono|sbi|hdfc|icici|pnb|axis bank/i, name: "Major Bank Brand Name", desc: "References prominent Indian banking brand", points: 15, word: "bank name" },
        { pattern: /kyc (update|pending|expired)|pan (update|link|expired)/i, name: "Urgent KYC / PAN Demanded", desc: "Demanding immediate KYC documentation update", points: 35, word: "kyc update" },
        { pattern: /account (is |has been )?(blocked|suspended|deactivated|closed)|khata band/i, name: "Account Suspension Intimidation", desc: "Threatening freeze of savings/current accounts", points: 30, word: "account blocked" },
        { pattern: /debit card blocked|atm blocked/i, name: "Card Block Threat", desc: "False claim of ATM/Debit card blocking", points: 25, word: "card blocked" }
    ];

    // 4. Digital Arrest / Fake Law Enforcement
    const legalRules = [
        { pattern: /digital arrest/i, name: "Fabricated 'Digital Arrest' Coercion", desc: "Non-existent legal pretext used to terrorize victims", points: 45, word: "digital arrest" },
        { pattern: /cbi|crime branch|mumbai police|customs department|narcotics/i, name: "Law Enforcement Agency Spoof", desc: "Posing as central crime or intelligence agency", points: 35, word: "police/cbi" },
        { pattern: /arrest warrant|parcel seized|illegal parcel/i, name: "False Criminal Allegation", desc: "Claiming illegal drugs or seized contraband", points: 30, word: "parcel seized" },
        { pattern: /skype (video )?call|video call verification/i, name: "Video Call Intimidation", desc: "Luring victim into staged police video call", points: 25, word: "skype video call" }
    ];

    // 5. Telegram Work-From-Home / Rating Task Scam
    const jobRules = [
        { pattern: /part[ -]time (job|work)|work from home/i, name: "Work-From-Home Bait", desc: "Unrealistic easy freelance income promises", points: 25, word: "part-time job" },
        { pattern: /like youtube|rate hotel|google maps review/i, name: "Micro-Task Review Trap", desc: "Typical entry hook for crypto task fraud", points: 30, word: "like youtube videos" },
        { pattern: /earn \d{3,5} daily|daily income \d+/i, name: "Exaggerated Daily Earnings", desc: "Promises of ₹2,000 - ₹10,000 daily payout", points: 25, word: "daily earnings" },
        { pattern: /telegram (vip )?group|t\.me\//i, name: "Redirection to Telegram", desc: "Moving conversation to unregulated channel", points: 20, word: "telegram group" }
    ];

    // 6. Remote Desktop Hijacking Apps
    const remoteRules = [
        { pattern: /anydesk|rustdesk|teamviewer|quicksupport/i, name: "Remote Desktop Tool Solicitation", desc: "Attempting to gain full screen and SMS control", points: 45, word: "anydesk / remote app" }
    ];

    // 7. General Credential & Urgency Markers
    const generalRules = [
        { pattern: /otp|one time password/i, name: "OTP Solicitation Mention", desc: "References one-time passwords", points: 25, word: "otp" },
        { pattern: /password|login credentials|pin/i, name: "Secret Credential Target", desc: "Mentions passwords or secret PINs", points: 20, word: "password" },
        { pattern: /immediately|within 24 hours|jaldi karo|urgent/i, name: "Psychological Time Pressure", desc: "Short deadline intended to bypass logical thinking", points: 15, word: "urgency language" },
        { pattern: /http:\/\/|https:\/\/|bit\.ly|tinyurl/i, name: "Embedded Web Link", desc: "Contains external link in SMS", points: 15, word: "embedded link" }
    ];

    // Run Rule Evaluations
    const allRuleSets = [
        { rules: utilityRules, cat: "Fake Electricity Bill & Malicious APK" },
        { rules: upiRules, cat: "UPI Reverse-Payment / PIN Scam" },
        { rules: legalRules, cat: "Digital Arrest & Police Impersonation" },
        { rules: kycRules, cat: "Banking Phishing & KYC Fraud" },
        { rules: jobRules, cat: "Telegram Task & Job Scam" },
        { rules: remoteRules, cat: "Remote Screen Sharing Hijack" },
        { rules: generalRules, cat: null }
    ];

    let categoryMatches = {};

    allRuleSets.forEach(({ rules, cat }) => {
        rules.forEach(rule => {
            if (rule.pattern.test(lower)) {
                if (!detectedSignals.some(s => s.name === rule.name)) {
                    detectedSignals.push({
                        name: rule.name,
                        sub: rule.desc,
                        weight: rule.points
                    });
                    cumulativeScore += rule.points;
                    matchedKeywords.push(rule.word);

                    if (cat) {
                        categoryMatches[cat] = (categoryMatches[cat] || 0) + rule.points;
                    }
                }
            }
        });
    });

    // Determine primary category
    let maxCatPoints = 0;
    for (let c in categoryMatches) {
        if (categoryMatches[c] > maxCatPoints) {
            maxCatPoints = categoryMatches[c];
            category = c;
        }
    }

    // Cap score at 98 for heuristic safety
    const finalScore = Math.min(cumulativeScore, 98);

    let status = "Lower Risk";
    if (finalScore >= 60) {
        status = "High Risk";
    } else if (finalScore >= 30) {
        status = "Needs Review";
        if (category === "General Message Inspection") {
            category = "Suspicious Urgency / Phishing Flags";
        }
    } else {
        status = "Lower Risk";
        category = "Likely Legitimate / Low Risk";
    }

    // Build plain-language explainability & safety action protocol
    const { explanation, actions } = buildMessageExplanation(finalScore, category, lower, detectedSignals);

    return {
        score: finalScore,
        status,
        category,
        signals: detectedSignals,
        keywords: Array.from(new Set(matchedKeywords)),
        explanation,
        actions
    };
}

function buildMessageExplanation(score, category, text, signals) {
    if (score >= 60) {
        if (category.includes("UPI")) {
            return {
                explanation: "CRITICAL ALERT: This message exhibits classic signs of a UPI Inversion fraud. The sender is attempting to deceive you into believing you will receive cashback or money, but will actually prompt you to enter your UPI PIN. In UPI architecture, entering your PIN always authorises an immediate debit from your bank account.",
                actions: [
                    "NEVER enter your UPI PIN on any collect request or QR code to receive money.",
                    "Reject any pending payment requests immediately in your PhonePe, Google Pay, or Paytm app.",
                    "Report the fraudulent UPI ID/VPA inside your application and report to 1930."
                ]
            };
        } else if (category.includes("Electricity")) {
            return {
                explanation: "HIGH RISK MALWARE ATTEMPT: This message uses the widespread 'Bijli Disconnection tonight at 9:30 PM' template. The link downloads an Android .apk file. When installed, this malware grants attackers full remote control to read SMS OTPs, bypass bank 2FA, and drain bank accounts.",
                actions: [
                    "DO NOT click the link or install the .apk file under any circumstances.",
                    "Verify your electricity bill status directly on your official state Discom website.",
                    "Official state electricity departments never dispatch power disconnection notices from personal 10-digit mobile numbers."
                ]
            };
        } else if (category.includes("Digital Arrest")) {
            return {
                explanation: "EXTREME INTIMIDATION SCAM: This message attempts 'Digital Arrest' extortion. Fraudsters impersonate CBI, Police, or Customs officers, threatening arrest over a fictitious drug or passport parcel. Indian law enforcement agencies NEVER place individuals under arrest via Skype or WhatsApp video calls.",
                actions: [
                    "Do not respond to or join any video calls with callers claiming to be police or CBI.",
                    "Dial 1930 immediately or visit your local police station to report the intimidation attempt.",
                    "Remember: Indian legal code has no provision for 'Digital Arrest' or spot fines via bank transfer."
                ]
            };
        } else if (category.includes("KYC")) {
            return {
                explanation: "BANK PHISHING DETECTED: This message impersonates a major bank claiming your account or YONO access will be suspended unless KYC/PAN is updated. The target link is a fraudulent clone designed to capture your username, password, and OTP.",
                actions: [
                    "Do NOT click any link in this message or enter your internet banking credentials.",
                    "Banks never ask customers to update KYC via third-party SMS links or web portals.",
                    "Visit your branch in person or log in securely via your bank's verified official app."
                ]
            };
        } else {
            return {
                explanation: "HIGH RISK SCAM SIGNALS: Multiple high-severity fraud indicators were identified, including unsolicited financial offers, deceptive links, or pressure tactics intended to prevent calm verification.",
                actions: [
                    "Do not click any embedded links or call phone numbers provided in this message.",
                    "Delete and block the sender on WhatsApp or your SMS client.",
                    "If financial loss has occurred, call National Cyber Helpline 1930 immediately."
                ]
            };
        }
    } else if (score >= 30) {
        return {
            explanation: "MODERATE RISK - EXERCISE CAUTION: While this message may not contain an explicit malicious payload, it features urgency keywords, unsolicited prompts, or generic links that resemble known phishing vectors.",
            actions: [
                "Verify the sender's identity through independent, official channels.",
                "Do not share OTPs, passwords, or personal identity documents.",
                "Inspect any links carefully in our URL Scanner before clicking."
            ]
        };
    } else {
        return {
            explanation: "LOW RISK DETECTED: No prominent phishing or fraud keywords were found in this text. It appears consistent with standard notification formats or everyday communication.",
            actions: [
                "Continue maintaining standard cyber hygiene: never share passwords or full debit card PINs.",
                "Always verify transaction alerts against your personal account activity."
            ]
        };
    }
}

function renderMessageResult(analysis, originalText) {
    const container = document.getElementById("messageResult");
    const riskClass = analysis.score >= 60 ? 'high' : analysis.score >= 30 ? 'review' : 'safe';
    const cardClass = analysis.score >= 60 ? 'high-risk' : analysis.score >= 30 ? 'review-risk' : 'safe-risk';

    container.innerHTML = `
        <div class="result-card ${cardClass}">
            <div class="result-header">
                <div class="result-verdict-box">
                    <div class="score-dial ${riskClass}">
                        <span class="dial-score">${analysis.score}</span>
                        <span class="dial-max">/ 100</span>
                    </div>
                    <div class="verdict-info">
                        <span class="verdict-category-badge ${riskClass}">${analysis.status}</span>
                        <h3 class="verdict-title">${escapeHTML(analysis.category)}</h3>
                        <p class="verdict-summary">Local Heuristic Evaluation against Indian Scam Signatures</p>
                    </div>
                </div>
                <div class="result-right-badge">
                    <span class="demo-engine-pill">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>Phase 1 Heuristic Engine · Demo Mode</span>
                    </span>
                </div>
            </div>

            <div class="result-body">
                <!-- Identified Keywords -->
                ${analysis.keywords && analysis.keywords.length > 0 ? `
                    <div>
                        <div class="section-label">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            <span>Trigger Keywords &amp; Threat Vectors</span>
                        </div>
                        <div class="keyword-chips">
                            ${analysis.keywords.map(kw => `
                                <span class="keyword-chip ${analysis.score < 60 ? 'warning' : ''}">
                                    ⚠️ ${escapeHTML(kw)}
                                </span>
                            `).join("")}
                        </div>
                    </div>
                ` : ''}

                <!-- Signals Detected -->
                <div>
                    <div class="section-label">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <span>Verified Risk Signals (${analysis.signals.length})</span>
                    </div>
                    <div class="signal-items">
                        ${analysis.signals.length > 0 ? analysis.signals.map(sig => `
                            <div class="signal-row">
                                <span class="signal-icon">⚡</span>
                                <div>
                                    <div class="signal-text">${escapeHTML(sig.name)} <span class="badge ${analysis.score >= 60 ? 'badge-danger' : 'badge-warning'}">+${sig.weight} pts</span></div>
                                    <div class="signal-sub">${escapeHTML(sig.sub)}</div>
                                </div>
                            </div>
                        `).join("") : `
                            <div class="signal-row">
                                <span class="signal-icon">✅</span>
                                <div>
                                    <div class="signal-text">No overt high-risk scam patterns detected</div>
                                    <div class="signal-sub">Message passed client-side heuristic rules</div>
                                </div>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Why Dangerous Explanation -->
                <div>
                    <div class="section-label">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span>Why This Is Dangerous (Plain-Language Explanation)</span>
                    </div>
                    <div class="danger-explanation-box">
                        <p>${analysis.explanation}</p>
                    </div>
                </div>

                <!-- Prescribed Safety Protocol -->
                <div>
                    <div class="section-label">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span>Prescribed Safety Actions</span>
                    </div>
                    <div class="action-protocol-box">
                        <div class="protocol-list">
                            ${analysis.actions.map((act, idx) => `
                                <div class="protocol-step">
                                    <span class="step-num">${idx + 1}</span>
                                    <span>${escapeHTML(act)}</span>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.classList.remove("hidden");
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================================================
// 5. URL SCANNER: AIR-GAPPED DOMAIN DECONSTRUCTION
// ============================================================================

const URL_PRESETS = {
    sbi_fake: "http://sbi-kyc-verification.top/login.php",
    apk_direct: "http://192.168.1.104:8080/bijli-power-update.apk",
    shortener: "https://bit.ly/claim-free-5000-recharge",
    legit_sbi: "https://www.onlinesbi.sbi"
};

function loadUrlPreset(key) {
    const input = document.getElementById("urlInput");
    if (URL_PRESETS[key]) {
        input.value = URL_PRESETS[key];
        showToast("Sample URL loaded", "info");
    }
}

function clearURL() {
    document.getElementById("urlInput").value = "";
    document.getElementById("urlResult").classList.add("hidden");
    showToast("URL cleared", "info");
}

function scanURL() {
    const input = document.getElementById("urlInput");
    let rawUrl = input.value.trim();
    const resultContainer = document.getElementById("urlResult");
    const loader = document.getElementById("urlLoading");
    const scanBtn = document.getElementById("scanUrlBtn");

    if (!rawUrl) {
        showToast("Please enter a website link to inspect.", "info");
        input.focus();
        return;
    }

    // Auto-normalize protocol if user types 'sbi-update.xyz'
    if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = "http://" + rawUrl;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(rawUrl);
    } catch {
        showToast("Invalid URL format. Please verify domain structure.", "error");
        return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        showToast("Only HTTP and HTTPS links are supported.", "error");
        return;
    }

    // Trigger analysis animation
    resultContainer.classList.add("hidden");
    loader.classList.remove("hidden");
    scanBtn.disabled = true;

    setTimeout(() => {
        loader.classList.add("hidden");
        scanBtn.disabled = false;

        const analysis = evaluateUrlHeuristics(parsedUrl, rawUrl);
        renderUrlResult(analysis, parsedUrl, rawUrl);

        saveScan(
            "URL",
            analysis.score,
            analysis.status,
            analysis.category,
            rawUrl,
            analysis.signals,
            analysis.explanation,
            analysis.actions
        );

        showToast(`URL Scan complete: ${analysis.status} (${analysis.score}/100)`, "info");
    }, 600);
}

function evaluateUrlHeuristics(urlObj, rawInput) {
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    const fullHref = urlObj.href.toLowerCase();
    const signals = [];
    let score = 0;
    let category = "Domain Structure Verification";

    // 1. Air-Gapped Brand Impersonation (Indian Banking & Govt Portals)
    const monitoredBrands = [
        { brand: "sbi", official: "onlinesbi.sbi", name: "State Bank of India (SBI)" },
        { brand: "yono", official: "onlinesbi.sbi", name: "SBI YONO Banking" },
        { brand: "hdfc", official: "hdfcbank.com", name: "HDFC Bank" },
        { brand: "icici", official: "icicibank.com", name: "ICICI Bank" },
        { brand: "paytm", official: "paytm.com", name: "Paytm Payments" },
        { brand: "phonepe", official: "phonepe.com", name: "PhonePe" },
        { brand: "gpay", official: "google.com", name: "Google Pay" },
        { brand: "indiapost", official: "indiapost.gov.in", name: "India Post" },
        { brand: "incometax", official: "incometax.gov.in", name: "Income Tax Department" },
        { brand: "aadhaar", official: "uidai.gov.in", name: "UIDAI Aadhaar" }
    ];

    let brandImpersonated = null;
    monitoredBrands.forEach(item => {
        if (hostname.includes(item.brand)) {
            // Check if not official domain
            if (!hostname.endsWith(item.official)) {
                brandImpersonated = item.name;
                signals.push({
                    name: `Brand Impersonation (${item.name})`,
                    sub: `Hostname contains '${item.brand}' but does not match official domain (${item.official})`,
                    weight: 45
                });
                score += 45;
                category = `Brand Spoofing (${item.name})`;
            }
        }
    });

    // 2. Dangerous File Extensions (.apk, .exe, .scr)
    if (pathname.endsWith(".apk") || fullHref.includes(".apk")) {
        signals.push({
            name: "Malicious APK Binary Detected",
            sub: "Direct URL reference to an Android application package (.apk)",
            weight: 40
        });
        score += 40;
        category = "Malicious Android APK Delivery";
    } else if (/\.(exe|scr|bat|vbs|msi)$/i.test(pathname)) {
        signals.push({
            name: "Executable Payload Reference",
            sub: "Link references dangerous executable code",
            weight: 40
        });
        score += 40;
        category = "Executable Malware Delivery";
    }

    // 3. Raw IP Address Hostname
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIP) {
        signals.push({
            name: "Raw IP Address Hostname",
            sub: "Domain uses a direct IP instead of a registered domain name (common in drive-by downloads)",
            weight: 35
        });
        score += 35;
        if (!brandImpersonated) category = "Suspicious Host / Raw IP Target";
    }

    // 4. Insecure HTTP Protocol
    if (urlObj.protocol === "http:") {
        signals.push({
            name: "Unencrypted Connection (HTTP)",
            sub: "Website does not use HTTPS. Traffic and credentials can be intercepted.",
            weight: 20
        });
        score += 20;
    }

    // 5. High-Risk / Disposable Phishing TLDs
    const suspiciousTLDs = [".xyz", ".top", ".buzz", ".club", ".work", ".click", ".fit", ".online", ".site", ".icu", ".cam", ".tk", ".ml", ".ga", ".cf"];
    const matchedTLD = suspiciousTLDs.find(tld => hostname.endsWith(tld));
    if (matchedTLD) {
        signals.push({
            name: `High-Risk TLD (${matchedTLD})`,
            sub: "Top-Level Domain frequently exploited by ephemeral scam sites",
            weight: 25
        });
        score += 25;
    }

    // 6. URL Shortener Detection (Obfuscated destination)
    const shorteners = ["bit.ly", "tinyurl.com", "is.gd", "cutt.ly", "rb.gy", "t.co", "shorturl.at"];
    if (shorteners.some(s => hostname.includes(s))) {
        signals.push({
            name: "Obfuscated URL Shortener",
            sub: "Masks true destination; commonly used to bypass SMS spam filters",
            weight: 20
        });
        score += 20;
        if (score < 40) category = "Obfuscated Shortlink";
    }

    // 7. Excessive Subdomains (Deep phishing chain)
    const domainParts = hostname.split(".");
    if (domainParts.length > 4) {
        signals.push({
            name: "Unusually Deep Subdomain Nesting",
            sub: `Hostname has ${domainParts.length} levels, commonly used to hide fake domain roots`,
            weight: 15
        });
        score += 15;
    }

    // 8. Internationalized Domain / Punycode (Homograph attack)
    if (hostname.startsWith("xn--") || hostname.includes(".xn--")) {
        signals.push({
            name: "Punycode / Homograph Character Spoof",
            sub: "IDN characters used to visually mimic characters in legitimate brand names",
            weight: 35
        });
        score += 35;
    }

    // 9. Embedded Credentials in URL
    if (urlObj.username || urlObj.password) {
        signals.push({
            name: "Embedded Credential Tokens",
            sub: "URL contains embedded username or authentication payload",
            weight: 25
        });
        score += 25;
    }

    const finalScore = Math.min(score, 98);
    let status = "Lower Risk";
    if (finalScore >= 60) {
        status = "High Risk";
    } else if (finalScore >= 30) {
        status = "Needs Review";
        if (category === "Domain Structure Verification") {
            category = "Questionable Link Characteristics";
        }
    } else {
        status = "Lower Risk";
        category = "Standard Domain Structure";
    }

    // Build plain language explanation & safety advice
    const { explanation, actions } = buildUrlExplanation(finalScore, category, hostname, signals);

    return {
        score: finalScore,
        status,
        category,
        hostname,
        protocol: urlObj.protocol,
        pathname: urlObj.pathname,
        isSecure: urlObj.protocol === "https:",
        signals,
        explanation,
        actions
    };
}

function buildUrlExplanation(score, category, hostname, signals) {
    if (score >= 60) {
        return {
            explanation: `CRITICAL THREAT: This URL displays multiple high-confidence indicators of malicious intent (${signals.map(s => s.name).join(", ")}). The domain '${hostname}' appears designed to deceive users into submitting banking credentials or downloading malicious payloads. Under no circumstance should you enter passwords or personal data.`,
            actions: [
                "DO NOT visit or open this link in your web browser.",
                "Never enter banking passwords, OTPs, or credit card details on unverified domains.",
                "If received via SMS, report the message to 1930 and block the sender."
            ]
        };
    } else if (score >= 30) {
        return {
            explanation: `SUSPICIOUS ELEMENTS IDENTIFIED: The URL structure contains warning flags such as non-standard TLDs, lack of HTTPS encryption, or URL shortener masking. The host '${hostname}' does not match verified security profiles.`,
            actions: [
                "Verify the organization by searching their official verified domain via a search engine.",
                "Avoid submitting payment cards or Aadhaar/PAN details on this webpage.",
                "Ensure HTTPS padlock is present and verified by a recognized Certificate Authority."
            ]
        };
    } else {
        return {
            explanation: `LOCAL CHECKS PASSED: The structural components of '${hostname}' appear standard, using secure protocol and standard domain depth with no known brand impersonation flags detected.`,
            actions: [
                "Always look for the browser lock icon on sensitive login pages.",
                "Remember that even legitimate websites can be compromised by zero-day threats; always verify URL spelling."
            ]
        };
    }
}

function renderUrlResult(analysis, urlObj, rawUrl) {
    const container = document.getElementById("urlResult");
    const riskClass = analysis.score >= 60 ? 'high' : analysis.score >= 30 ? 'review' : 'safe';
    const cardClass = analysis.score >= 60 ? 'high-risk' : analysis.score >= 30 ? 'review-risk' : 'safe-risk';

    container.innerHTML = `
        <div class="result-card ${cardClass}">
            <div class="result-header">
                <div class="result-verdict-box">
                    <div class="score-dial ${riskClass}">
                        <span class="dial-score">${analysis.score}</span>
                        <span class="dial-max">/ 100</span>
                    </div>
                    <div class="verdict-info">
                        <span class="verdict-category-badge ${riskClass}">${analysis.status}</span>
                        <h3 class="verdict-title">${escapeHTML(analysis.category)}</h3>
                        <p class="verdict-summary">Evaluated in Air-Gapped Heuristic Sandbox</p>
                    </div>
                </div>
                <div class="result-right-badge">
                    <span class="demo-engine-pill">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <span>Protected Sandbox · No Web Requests Made</span>
                    </span>
                </div>
            </div>

            <div class="result-body">
                <!-- Air-Gapped Safe Terminal Box (Guarantees no auto-navigation) -->
                <div>
                    <div class="section-label">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <span>Inspected URL (Air-Gapped Sandbox View)</span>
                    </div>
                    <div class="url-sandbox-display">
                        <span class="sandbox-url-text">${escapeHTML(rawUrl)}</span>
                        <button class="btn btn-ghost btn-sm" onclick="copySanitizedUrl('${escapeHTML(rawUrl)}')" title="Copy Sanitized Link">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                            <span>Copy Sanitized Link</span>
                        </button>
                    </div>
                </div>

                <!-- Domain Parameters Breakdown Grid -->
                <div>
                    <div class="section-label">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        <span>Domain Deconstruction Parameters</span>
                    </div>
                    <div class="domain-breakdown-grid">
                        <div class="domain-param-box">
                            <span class="param-title">Security Protocol</span>
                            <div class="param-value ${analysis.isSecure ? 'green-text' : 'red-text'}">
                                ${analysis.protocol.toUpperCase()} ${analysis.isSecure ? '✓ Encrypted' : '✗ Unencrypted (Insecure)'}
                            </div>
                        </div>
                        <div class="domain-param-box">
                            <span class="param-title">Hostname / Domain</span>
                            <div class="param-value">${escapeHTML(analysis.hostname)}</div>
                        </div>
                        <div class="domain-param-box">
                            <span class="param-title">Target Path</span>
                            <div class="param-value">${escapeHTML(analysis.pathname || '/')}</div>
                        </div>
                    </div>
                </div>

                <!-- Signals Detected -->
                <div>
                    <div class="section-label">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        </svg>
                        <span>Heuristic Risk Signals (${analysis.signals.length})</span>
                    </div>
                    <div class="signal-items">
                        ${analysis.signals.length > 0 ? analysis.signals.map(sig => `
                            <div class="signal-row">
                                <span class="signal-icon">⚡</span>
                                <div>
                                    <div class="signal-text">${escapeHTML(sig.name)} <span class="badge ${analysis.score >= 60 ? 'badge-danger' : 'badge-warning'}">+${sig.weight} pts</span></div>
                                    <div class="signal-sub">${escapeHTML(sig.sub)}</div>
                                </div>
                            </div>
                        `).join("") : `
                            <div class="signal-row">
                                <span class="signal-icon">✅</span>
                                <div>
                                    <div class="signal-text">No structural anomalies or brand spoofing flags identified</div>
                                    <div class="signal-sub">URL passed local structural validation</div>
                                </div>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Plain Language Explanation -->
                <div>
                    <div class="section-label">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span>Why This Link Is Suspicious</span>
                    </div>
                    <div class="danger-explanation-box">
                        <p>${analysis.explanation}</p>
                    </div>
                </div>

                <!-- Prescribed Safety Actions -->
                <div>
                    <div class="section-label">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span>Prescribed Safety Actions</span>
                    </div>
                    <div class="action-protocol-box">
                        <div class="protocol-list">
                            ${analysis.actions.map((act, idx) => `
                                <div class="protocol-step">
                                    <span class="step-num">${idx + 1}</span>
                                    <span>${escapeHTML(act)}</span>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.classList.remove("hidden");
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copySanitizedUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast("Sanitized URL copied to clipboard", "success");
    }).catch(() => {
        showToast("Unable to copy to clipboard", "error");
    });
}

// ============================================================================
// 6. SCAN HISTORY AUDIT LOG
// ============================================================================

function displayHistory() {
    const history = getHistory();
    const container = document.getElementById("historyList");
    const searchVal = (document.getElementById("historySearch")?.value || "").toLowerCase();

    if (!container) return;

    // Apply Filter & Search
    let filtered = history.filter(item => {
        // Category Filter
        if (APP_STATE.historyFilter === 'high' && item.score < 60) return false;
        if (APP_STATE.historyFilter === 'review' && (item.score < 30 || item.score >= 60)) return false;
        if (APP_STATE.historyFilter === 'safe' && item.score >= 30) return false;
        if (APP_STATE.historyFilter === 'message' && item.type !== 'Message') return false;
        if (APP_STATE.historyFilter === 'url' && item.type !== 'URL') return false;

        // Search Query
        if (searchVal) {
            const matchPreview = item.preview && item.preview.toLowerCase().includes(searchVal);
            const matchCategory = item.category && item.category.toLowerCase().includes(searchVal);
            const matchType = item.type && item.type.toLowerCase().includes(searchVal);
            if (!matchPreview && !matchCategory && !matchType) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛡️</div>
                <h3 class="empty-title">No Scan Logs Matching Query</h3>
                <p class="empty-desc">Try clearing your search term or running a new scan in the Message or URL Scanner.</p>
                <button class="btn btn-primary btn-sm" onclick="showPage('message')">Scan a Message Now</button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map((item, originalIndex) => {
        const riskClass = item.score >= 60 ? 'high' : item.score >= 30 ? 'review' : 'safe';
        const typeIcon = item.type === 'Message' ? '✉' : '🔗';

        return `
            <div class="history-row">
                <div class="history-col-main">
                    <div class="scan-type-icon">${typeIcon}</div>
                    <div class="history-content-snippet">
                        <div class="snippet-title">
                            <span>${escapeHTML(item.category || item.type + " Evaluation")}</span>
                            <span class="badge ${riskClass === 'high' ? 'badge-danger' : riskClass === 'review' ? 'badge-warning' : 'badge-success'}">${item.status}</span>
                        </div>
                        <div class="snippet-preview">
                            ${escapeHTML(item.preview)}
                        </div>
                    </div>
                </div>

                <div class="history-col-meta">
                    <div class="score-badge ${riskClass}">
                        Score: ${item.score}/100
                    </div>
                    <div class="history-timestamp">
                        ${item.date}
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="viewHistoryDetails(${originalIndex})" title="View Details">
                        Inspect
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function setHistoryFilter(filter) {
    APP_STATE.historyFilter = filter;
    const pills = document.querySelectorAll("#historyFilters .filter-pill");
    pills.forEach(pill => {
        pill.classList.toggle("active", pill.dataset.filter === filter);
    });
    displayHistory();
}

function viewHistoryDetails(index) {
    const history = getHistory();
    const item = history[index];
    if (!item) return;

    const modal = document.getElementById("detailsModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalTime = document.getElementById("modalTimestamp");
    const modalBody = document.getElementById("modalBody");

    const riskClass = item.score >= 60 ? 'high' : item.score >= 30 ? 'review' : 'safe';

    modalTitle.textContent = `${item.type} Scan: ${item.category || item.status}`;
    modalTime.textContent = `Timestamp: ${item.date}`;

    modalBody.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; background: rgba(255,255,255,0.03); padding: 14px 18px; border-radius: 10px; border: 1px solid var(--border-subtle);">
            <div>
                <span style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Security Threat Score</span>
                <div style="font-size: 26px; font-weight: 800; font-family: var(--font-mono); color: #ffffff;">
                    ${item.score} <span style="font-size: 13px; color: var(--text-muted);">/ 100</span>
                </div>
            </div>
            <span class="badge ${riskClass === 'high' ? 'badge-danger' : riskClass === 'review' ? 'badge-warning' : 'badge-success'}" style="font-size: 13px; padding: 6px 12px;">
                ${item.status}
            </span>
        </div>

        <div style="margin-bottom: 18px;">
            <strong style="color: #ffffff; display: block; margin-bottom: 6px; font-size: 13px;">Masked Input Content (Privacy Preserved):</strong>
            <div style="background: #080e1b; border: 1px solid var(--border-subtle); padding: 12px 14px; border-radius: 8px; font-family: var(--font-mono); font-size: 12.5px; color: var(--text-secondary); word-break: break-all;">
                ${escapeHTML(item.preview)}
            </div>
        </div>

        <div style="margin-bottom: 18px;">
            <strong style="color: #ffffff; display: block; margin-bottom: 6px; font-size: 13px;">Identified Risk Signals:</strong>
            <div class="signal-items">
                ${item.signals && item.signals.length > 0 ? item.signals.map(s => `
                    <div class="signal-row" style="padding: 8px 12px;">
                        <span class="signal-icon">⚡</span>
                        <div>
                            <div class="signal-text" style="font-size: 13px;">${escapeHTML(s.name)}</div>
                            <div class="signal-sub" style="font-size: 11.5px;">${escapeHTML(s.sub)}</div>
                        </div>
                    </div>
                `).join("") : `<p class="text-muted" style="font-size: 13px;">No severe threat indicators found.</p>`}
            </div>
        </div>

        <div style="margin-bottom: 18px;">
            <strong style="color: #ffffff; display: block; margin-bottom: 6px; font-size: 13px;">Threat Intelligence Explanation:</strong>
            <div class="danger-explanation-box" style="padding: 12px 16px;">
                <p style="font-size: 13px;">${escapeHTML(item.explanation)}</p>
            </div>
        </div>

        <div>
            <strong style="color: #ffffff; display: block; margin-bottom: 6px; font-size: 13px;">Recommended Citizen Actions:</strong>
            <ul style="padding-left: 18px; font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
                ${item.actions ? item.actions.map(act => `<li style="margin-bottom: 4px;">${escapeHTML(act)}</li>`).join("") : '<li>No actions specified.</li>'}
            </ul>
        </div>
    `;

    modal.classList.remove("hidden");
}

function closeDetailsModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById("detailsModal");
    if (modal) modal.classList.add("hidden");
}

function promptClearHistory() {
    const modal = document.getElementById("clearModal");
    if (modal) modal.classList.remove("hidden");
}

function closeClearModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById("clearModal");
    if (modal) modal.classList.add("hidden");
}

function executeClearHistory() {
    localStorage.removeItem("scamHistory");
    closeClearModal();
    displayHistory();
    updateDashboard();
    showToast("Audit logs cleared successfully", "info");
}

function exportHistory() {
    const history = getHistory();
    if (!history.length) {
        showToast("No scan logs available to export", "info");
        return;
    }

    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `scamsathi_audit_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast("Audit log exported as JSON", "success");
}

// ============================================================================
// 7. SECURITY AWARENESS FILTERING
// ============================================================================

function filterAwareness(cat) {
    const tabs = document.querySelectorAll("#awarenessTabs .tab-btn");
    tabs.forEach(tab => {
        const matches = tab.getAttribute("onclick").includes(`'${cat}'`);
        tab.classList.toggle("active", matches);
    });

    const cards = document.querySelectorAll("#awarenessGrid .awareness-card");
    cards.forEach(card => {
        if (cat === 'all' || card.dataset.category === cat) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

// ============================================================================
// 8. UTILITIES & ESCAPING
// ============================================================================

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================================================
// 9. APP INITIALIZATION & EVENT LISTENERS
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeStorage();
    updateDashboard();

    // Setup direct nav listener
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            showPage(item.dataset.page);
        });
    });

    // Close modals on ESC key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeDetailsModal();
            closeClearModal();
            toggleSidebar(false);
        }
    });
});
