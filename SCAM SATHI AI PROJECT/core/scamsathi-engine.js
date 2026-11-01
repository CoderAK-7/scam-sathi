// @ts-nocheck
/**
 * ScamSathi AI — Unified Cross-Platform Scam Detection Engine
 * 
 * Modular Architecture:
 *  - EmailDetector: Email headers, sender spoofing, KYC fraud, attachments
 *  - WhatsAppDetector: Chat messages, UPI traps, APK links, digital arrest
 *  - SMSDetector: SMS headers, OTP theft, electricity disconnection, lottery
 *  - URLDetector: Raw IP, shorteners, punycode, brand in subdomain, suspicious TLDs
 *  - PhishingDetector: Remote desktop hijack (AnyDesk), credential harvesting
 *  - ScamRiskScorer: Central 0-100 risk normalization and explainable verdict
 * 
 * Works in: Browser, PWA, Extension, Service Worker, Node.js
 * 100% Client-side. Zero remote data transmission. Local-first privacy.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ScamSathiCoreEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    "use strict";

    // ── Global Trusted Entities & Known Brand Signatures ───────────────────────
    var TRUSTED_DOMAINS = new Set([
        "sbi.co.in", "onlinesbi.sbi", "hdfcbank.com", "icicibank.com",
        "axisbank.com", "pnbindia.in", "bankofbaroda.in", "canarabank.com",
        "unionbankofindia.co.in", "yesbank.in", "kotakbank.com", "idbibank.in",
        "paytm.com", "phonepe.com", "googlepay.com", "bhimupi.org.in",
        "npci.org.in", "uidai.gov.in", "incometax.gov.in", "india.gov.in",
        "trai.gov.in", "rbi.org.in", "sebi.gov.in", "irctc.co.in", "cybercrime.gov.in",
        "amazon.in", "amazon.com", "flipkart.com", "myntra.com", "swiggy.com", "zomato.com",
        "google.com", "gmail.com", "youtube.com", "microsoft.com", "apple.com", "paypal.com"
    ]);

    var URL_SHORTENERS = new Set([
        "bit.ly", "tinyurl.com", "t.co", "ow.ly", "goo.gl", "rb.gy",
        "cutt.ly", "is.gd", "tiny.cc", "short.io", "lnkd.in", "buff.ly",
        "wa.me", "chat.whatsapp.com"
    ]);

    var SUSPICIOUS_TLDS = new Set([
        ".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".click", ".download",
        ".loan", ".work", ".gdn", ".win", ".racing", ".party", ".bid",
        ".trade", ".review", ".stream", ".webcam", ".fit", ".rest"
    ]);

    var INDIAN_BRANDS = [
        { name: "State Bank of India (SBI)", pattern: /\b(sbi|state\s*bank\s*of\s*india|yono)\b/i, officialDomain: "sbi.co.in" },
        { name: "HDFC Bank", pattern: /\b(hdfc|hdfc\s*bank)\b/i, officialDomain: "hdfcbank.com" },
        { name: "ICICI Bank", pattern: /\b(icici|icici\s*bank|imobile)\b/i, officialDomain: "icicibank.com" },
        { name: "Axis Bank", pattern: /\b(axis|axis\s*bank)\b/i, officialDomain: "axisbank.com" },
        { name: "Punjab National Bank (PNB)", pattern: /\b(pnb|punjab\s*national\s*bank)\b/i, officialDomain: "pnbindia.in" },
        { name: "Paytm / UPI", pattern: /\b(paytm|phonepe|gpay|google\s*pay|bhim|upi)\b/i, officialDomain: "npci.org.in" },
        { name: "Aadhaar / UIDAI", pattern: /\b(aadhaar|uidai|pan\s*card)\b/i, officialDomain: "uidai.gov.in" },
        { name: "Income Tax Department", pattern: /\b(income\s*tax|it\s*department|itr\s*refund)\b/i, officialDomain: "incometax.gov.in" },
        { name: "Electricity Board (DISCOM)", pattern: /\b(bijli|electricity|power\s*bill|discom|bses|uppcl|dhbvn|tneb|mseb)\b/i, officialDomain: "gov.in" }
    ];

    // ── MODULE 1: URLDetector ──────────────────────────────────────────────────
    var URLDetector = {
        analyze: function (rawUrl) {
            if (!rawUrl || typeof rawUrl !== 'string') {
                return { score: 0, risk: "low", findings: [] };
            }
            var findings = [];
            var score = 0;
            var cleanUrl = rawUrl.trim();

            try {
                if (!cleanUrl.match(/^https?:\/\//i)) {
                    cleanUrl = "http://" + cleanUrl;
                }
                var parsed = new URL(cleanUrl);
                var host = parsed.hostname.toLowerCase();
                var path = parsed.pathname.toLowerCase();

                // 1. Raw IP Host Detection
                if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(host)) {
                    score += 45;
                    findings.push({
                        type: "RAW_IP_HOST",
                        weight: 45,
                        text: "Direct IP address (" + host + ") bypasses domain registration and reputation checks."
                    });
                }

                // 2. Malicious Android APK delivery
                if (/\.(apk|exe|bat|vbs|scr|cmd|jar|zip)(\?|$)/i.test(path)) {
                    score += 40;
                    findings.push({
                        type: "MALICIOUS_APP_PAYLOAD",
                        weight: 40,
                        text: "Direct download link to an executable package file (.apk/.exe) often used to hijack mobile banking."
                    });
                }

                // 3. URL Shortener concealment
                if (URL_SHORTENERS.has(host)) {
                    score += 20;
                    findings.push({
                        type: "OBFUSCATED_SHORTENER",
                        weight: 20,
                        text: "URL shortener (" + host + ") obscures the true destination webpage."
                    });
                }

                // 4. Suspicious TLD
                SUSPICIOUS_TLDS.forEach(function (tld) {
                    if (host.endsWith(tld)) {
                        score += 25;
                        findings.push({
                            type: "HIGH_RISK_TLD",
                            weight: 25,
                            text: "Domain uses high-abuse top-level extension: " + tld
                        });
                    }
                });

                // 5. Brand Spoofing in Subdomain / Domain Name
                INDIAN_BRANDS.forEach(function (brand) {
                    if (brand.pattern.test(host)) {
                        var isRealDomain = host.endsWith("." + brand.officialDomain) || host === brand.officialDomain;
                        if (!isRealDomain) {
                            score += 35;
                            findings.push({
                                type: "BRAND_SPOOFING",
                                weight: 35,
                                text: "Impersonates " + brand.name + " on an unauthorized domain (" + host + ")."
                            });
                        }
                    }
                });

                // 6. Excessive Hyphens / Obfuscation
                var hyphenCount = (host.match(/-/g) || []).length;
                if (hyphenCount >= 3) {
                    score += 15;
                    findings.push({
                        type: "SUSPICIOUS_HYPHENS",
                        weight: 15,
                        text: "Excessive hyphens in hostname (" + hyphenCount + ") designed to evade visual detection."
                    });
                }

                // 7. Phishing keyword in URL path
                if (/\/(login|signin|verify|kyc|secure|update|netbanking|otp|auth)/i.test(path)) {
                    score += 15;
                    findings.push({
                        type: "SENSITIVE_URL_PATH",
                        weight: 15,
                        text: "URL contains authentication/KYC path keywords outside verified official banking domain."
                    });
                }

            } catch (e) {
                // Invalid URL syntax
                score += 10;
                findings.push({
                    type: "MALFORMED_URL",
                    weight: 10,
                    text: "Malformed or non-standard URL structure."
                });
            }

            return {
                url: rawUrl,
                score: Math.min(score, 100),
                risk: score >= 60 ? "high" : score >= 30 ? "suspicious" : "low",
                findings: findings
            };
        }
    };

    // ── MODULE 2: WhatsAppDetector ─────────────────────────────────────────────
    var WhatsAppDetector = {
        analyze: function (text) {
            var signals = [];
            var score = 0;
            var t = (text || "").toLowerCase();

            // 1. UPI Reverse-Payment / PIN Traps (India #1 Fraud)
            if (/(upi\s*pin|enter\s*(your\s*)?pin\s*to\s*(receive|get|claim)|send\s*pin|scan\s*qr\s*to\s*receive|refund.*pin)/i.test(t)) {
                score += 55;
                signals.push({
                    id: "UPI_PIN_RECEIVE",
                    name: "UPI PIN Reverse-Payment Trap",
                    sub: "Legitimate UPI transactions NEVER require entering a PIN to receive money.",
                    weight: 55
                });
            }

            // 2. Fake Electricity Bill & Malicious APK
            if (/(bijli|electricity|power\s*cut|disconnected|9:30\s*pm|urgent.*power|officer.*call).*(\.apk|contact|call|number)/i.test(t)) {
                score += 50;
                signals.push({
                    id: "BIJLI_DISCONNECT_MALWARE",
                    name: "Fake Electricity Bill Disconnection Trap",
                    sub: "Demands immediate contact or APK installation to prevent simulated power cutoff.",
                    weight: 50
                });
            }

            // 3. Digital Arrest & Police Extortion
            if (/(digital\s*arrest|cbi|cyber\s*police|trai.*suspend|sim\s*block.*2\s*hours|parcel.*drugs|customs\s*officer|skype\s*video)/i.test(t)) {
                score += 65;
                signals.push({
                    id: "DIGITAL_ARREST_EXTORTION",
                    name: "Digital Arrest & Police Extortion Fraud",
                    sub: "Indian law enforcement does not conduct online arrests or demand video deposits.",
                    weight: 65
                });
            }

            // 4. Remote Desktop Screen Hijack
            if (/(anydesk|teamviewer|rustdesk|quicksupport|screen\s*share|airdroid)/i.test(t)) {
                score += 50;
                signals.push({
                    id: "REMOTE_ACCESS_HIJACK",
                    name: "Remote Screen Sharing App Solicitation",
                    sub: "Scammers use AnyDesk/TeamViewer to view SMS OTPs and control mobile banking.",
                    weight: 50
                });
            }

            // 5. Telegram Task / Rating Scams
            if (/(telegram|part\s*time\s*job|rating\s*hotel|youtube\s*like|earn\s*(rs|inr)?\s*[\d,]+\s*(daily|per\s*day))/i.test(t)) {
                score += 40;
                signals.push({
                    id: "TELEGRAM_TASK_FRAUD",
                    name: "Part-Time Task & Daily Payout Scam",
                    sub: "Promises high daily income for simple YouTube/Google reviews to bait advance deposits.",
                    weight: 40
                });
            }

            // 6. Suspicious Embedded Links
            var urls = text.match(/https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.(top|xyz|apk|site|online|tk|ml)\b/gi) || [];
            urls.forEach(function (u) {
                var urlRes = URLDetector.analyze(u);
                if (urlRes.score > 20) {
                    score += Math.min(urlRes.score, 35);
                    signals.push({
                        id: "SUSPICIOUS_LINK_IN_CHAT",
                        name: "Deceptive Link: " + u.slice(0, 30),
                        sub: urlRes.findings.map(function(f){ return f.text; }).join(" "),
                        weight: Math.min(urlRes.score, 35)
                    });
                }
            });

            return {
                platform: "whatsapp",
                score: Math.min(score, 100),
                signals: signals
            };
        }
    };

    // ── MODULE 3: EmailDetector ────────────────────────────────────────────────
    var EmailDetector = {
        analyze: function (emailData) {
            var subject = String(emailData.subject || "");
            var body = String(emailData.body || "");
            var senderName = String(emailData.senderName || "");
            var senderEmail = String(emailData.senderEmail || "");
            var links = Array.isArray(emailData.links) ? emailData.links : [];

            var combinedText = subject + "\n" + body + "\n" + senderName;
            var signals = [];
            var score = 0;

            // 1. Sender Domain Mismatch / Free Provider Impersonation
            if (senderEmail) {
                var emailMatch = senderEmail.match(/@([a-zA-Z0-9.-]+)/);
                var senderDomain = emailMatch ? emailMatch[1].toLowerCase() : "";
                var isOfficial = TRUSTED_DOMAINS.has(senderDomain);

                INDIAN_BRANDS.forEach(function (b) {
                    if (b.pattern.test(senderName) || b.pattern.test(subject)) {
                        if (!isOfficial && senderDomain !== b.officialDomain) {
                            score += 35;
                            signals.push({
                                id: "EMAIL_SENDER_IMPERSONATION",
                                name: "Sender Domain Mismatch",
                                sub: "Email claims to represent " + b.name + " but originates from unauthorized domain @" + senderDomain,
                                weight: 35
                            });
                        }
                    }
                });

                if (/(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|rediffmail\.com)$/i.test(senderDomain)) {
                    if (/(bank|sbi|hdfc|icici|income\s*tax|police|court|customs|kyc|rbi)/i.test(combinedText)) {
                        score += 25;
                        signals.push({
                            id: "FREE_WEBMAIL_OFFICIAL_FRAUD",
                            name: "Free Webmail Used for Official Notice",
                            sub: "Institutions never send official compliance notices from generic @" + senderDomain + " accounts.",
                            weight: 25
                        });
                    }
                }
            }

            // 2. Urgent KYC and Account Lockout Demands
            if (/(kyc.*(blocked|suspended|update|expire)|pan.*link.*aadhaar|reactivate.*account|submit.*documents.*link)/i.test(combinedText)) {
                score += 30;
                signals.push({
                    id: "EMAIL_KYC_SUSPENSION_URGENCY",
                    name: "Urgent KYC Verification Demand",
                    sub: "Pressures recipient to click an unverified link under threat of immediate account suspension.",
                    weight: 30
                });
            }

            // 3. Credential Harvesting & Password Phishing
            if (/(reset\s*password|login\s*here|confirm\s*identity|unusual\s*sign-in|account\s*compromised.*click)/i.test(combinedText)) {
                score += 25;
                signals.push({
                    id: "EMAIL_PASSWORD_PHISHING",
                    name: "Credential Harvesting Directive",
                    sub: "Prompts recipient to provide credentials via external webpage.",
                    weight: 25
                });
            }

            // 4. Fake Lottery, Inheritance & Prize Scams
            if (/(lottery\s*winner|won\s*(rs|inr|\$)?\s*[\d,]+|congratulations.*selected|claim\s*reward|processing\s*fee)/i.test(combinedText)) {
                score += 35;
                signals.push({
                    id: "EMAIL_ADVANCE_FEE_PRIZE",
                    name: "Advance-Fee Lottery / Prize Scam",
                    sub: "Promises non-existent funds while requiring upfront payment or personal data.",
                    weight: 35
                });
            }

            // 5. Inspect Links in Email Body
            links.forEach(function (link) {
                var uRes = URLDetector.analyze(link);
                if (uRes.score >= 25) {
                    score += Math.min(uRes.score, 30);
                    signals.push({
                        id: "EMAIL_DECEPTIVE_HYPERLINK",
                        name: "Phishing Link: " + link.slice(0, 35),
                        sub: uRes.findings.map(function(f){ return f.text; }).join(" "),
                        weight: Math.min(uRes.score, 30)
                    });
                }
            });

            return {
                platform: "email",
                score: Math.min(score, 100),
                signals: signals
            };
        }
    };

    // ── MODULE 4: SMSDetector ──────────────────────────────────────────────────
    var SMSDetector = {
        analyze: function (smsText, senderHeader) {
            var signals = [];
            var score = 0;
            var t = (smsText || "").toLowerCase();
            var header = (senderHeader || "").toUpperCase().trim();

            // 1. Sender Header Analysis (Indian SMS Protocol: e.g. VK-SBIINB vs +91 phone numbers)
            if (header) {
                var isPersonalNumber = /^(\+91|91)?[6-9]\d{9}$/.test(header.replace(/[\s-]/g, ''));
                if (isPersonalNumber && /(sbi|hdfc|icici|bank|electricity|bijli|traffic|challan|kyc)/i.test(t)) {
                    score += 45;
                    signals.push({
                        id: "SMS_PERSONAL_NUMBER_SPOOF",
                        name: "Personal Mobile Number for Banking/Official SMS",
                        sub: "Official SMS must use verified DLT Alpha Headers (e.g., AD-HDFCBK), not personal 10-digit mobile numbers (" + header + ").",
                        weight: 45
                    });
                }
            }

            // 2. SIM Card Deactivation / e-SIM Swap Scam
            if (/(sim\s*block|esim\s*request|sim\s*deactivat|kyc.*airtel|jio.*document|trai.*suspend.*number)/i.test(t)) {
                score += 45;
                signals.push({
                    id: "SMS_ESIM_SWAP_THREAT",
                    name: "SIM Block / e-SIM Swap Attack",
                    sub: "Attempts to bait user into initiating unauthorized SIM swap or sharing porting codes.",
                    weight: 45
                });
            }

            // 3. Traffic Challan Fake APK Scam
            if (/(traffic\s*challan|echallan|parivahan.*due|fine.*court|pay.*challan.*apk)/i.test(t)) {
                score += 40;
                signals.push({
                    id: "SMS_FAKE_TRAFFIC_CHALLAN",
                    name: "Fake e-Challan APK Phishing",
                    sub: "Simulates traffic violation fines to trick victims into downloading malware.",
                    weight: 40
                });
            }

            // 4. SMS WhatsApp/OTP Demands
            if (/(share\s*otp|forward\s*this\s*sms|code\s*is\s*[\d]{4,6}.*do\s*not\s*share.*call)/i.test(t)) {
                score += 35;
                signals.push({
                    id: "SMS_OTP_EXTRACTION",
                    name: "OTP Interception Solicitation",
                    sub: "Requests one-time passwords or SMS forwards to access financial accounts.",
                    weight: 35
                });
            }

            // 5. Embedded link analysis in SMS
            var urls = smsText.match(/https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.(top|xyz|apk|site|online|tk|ml)\b/gi) || [];
            urls.forEach(function (u) {
                var uRes = URLDetector.analyze(u);
                if (uRes.score >= 25) {
                    score += Math.min(uRes.score, 35);
                    signals.push({
                        id: "SMS_SUSPICIOUS_LINK",
                        name: "Suspicious Link in SMS: " + u.slice(0, 30),
                        sub: uRes.findings.map(function(f){ return f.text; }).join(" "),
                        weight: Math.min(uRes.score, 35)
                    });
                }
            });

            return {
                platform: "sms",
                score: Math.min(score, 100),
                signals: signals
            };
        }
    };

    // ── MODULE 5: PhishingDetector ─────────────────────────────────────────────
    var PhishingDetector = {
        detectCommonTraps: function (content) {
            var text = typeof content === 'string' ? content : JSON.stringify(content);
            var traps = [];

            if (/pin\s*to\s*receive/i.test(text)) traps.push("UPI Reverse-PIN Trap");
            if (/\.apk/i.test(text)) traps.push("Malicious Android Package (.apk)");
            if (/digital\s*arrest/i.test(text)) traps.push("Digital Arrest Extortion");
            if (/anydesk|teamviewer/i.test(text)) traps.push("Remote Desktop Access Hijack");
            if (/electricity.*disconnect|bijli/i.test(text)) traps.push("DISCOM Power Cutoff Fraud");
            if (/part\s*time\s*job|rating.*daily/i.test(text)) traps.push("Telegram Task Fraud");

            return traps;
        }
    };

    // ── MODULE 6: ScamRiskScorer (Central Unified Normalizer) ──────────────────
    var ScamRiskScorer = {
        computeVerdict: function (score, signals, platform) {
            var riskLevel = "low";
            var badgeText = "Low Risk / Likely Safe";
            var color = "#10b981";

            if (score >= 80) {
                riskLevel = "critical";
                badgeText = "CRITICAL SCAM THREAT";
                color = "#7c3aed";
            } else if (score >= 60) {
                riskLevel = "high";
                badgeText = "HIGH SCAM RISK";
                color = "#ef4444";
            } else if (score >= 30) {
                riskLevel = "suspicious";
                badgeText = "SUSPICIOUS / REVIEW ADVISED";
                color = "#f59e0b";
            }

            // Derive Primary Category
            var category = "General Safe Content";
            if (signals.length > 0) {
                // Pick signal with highest weight
                var sorted = signals.slice().sort(function(a, b) { return b.weight - a.weight; });
                category = sorted[0].name;
            }

            // Generate Actionable Explanations
            var explanation = "No prominent phishing or financial fraud indicators were recognized in this " + platform + " content.";
            if (signals.length > 0) {
                explanation = "ScamSathi detected " + signals.length + " security alert(s): " + 
                              signals.map(function(s){ return s.name; }).join(", ") + ".";
            }

            // Prescribed Safety Actions
            var actions = [];
            if (riskLevel === "critical" || riskLevel === "high") {
                actions.push("NEVER enter your UPI PIN to claim prizes or receive cashback refunds.");
                actions.push("Do not click links or install any .apk application sent over chat or SMS.");
                actions.push("National Cyber Helpline: Dial 1930 or report at cybercrime.gov.in.");
                actions.push("Block sender immediately and do not engage in further discussion.");
            } else if (riskLevel === "suspicious") {
                actions.push("Verify authenticity directly on the official banking portal or website.");
                actions.push("Check official telephone numbers via passbook or verified customer care.");
            } else {
                actions.push("Always exercise standard vigilance with unexpected messages or payment links.");
            }

            return {
                score: score,
                risk: riskLevel,
                badgeText: badgeText,
                category: category,
                color: color,
                explanation: explanation,
                actions: actions,
                signals: signals,
                platform: platform,
                timestamp: Date.now()
            };
        }
    };

    // ── Unified Master Engine Entry Point ──────────────────────────────────────
    function scan(input, platformHint) {
        var hint = (platformHint || "").toLowerCase();
        var rawText = typeof input === 'string' ? input : (input.body || input.text || input.message || "");
        var signals = [];
        var totalScore = 0;
        var activePlatform = hint || "message";

        // Auto-route to platform specialist
        if (hint === "whatsapp" || (!hint && (rawText.includes("WhatsApp") || /bijli|upi\s*pin|digital\s*arrest/i.test(rawText)))) {
            activePlatform = "whatsapp";
            var waRes = WhatsAppDetector.analyze(rawText);
            totalScore += waRes.score;
            signals = signals.concat(waRes.signals);
        } else if (hint === "email" || (typeof input === 'object' && (input.subject || input.senderEmail))) {
            activePlatform = "email";
            var emRes = EmailDetector.analyze(typeof input === 'object' ? input : { body: rawText, subject: "" });
            totalScore += emRes.score;
            signals = signals.concat(emRes.signals);
        } else if (hint === "sms") {
            activePlatform = "sms";
            var smsRes = SMSDetector.analyze(rawText, input.sender || "");
            totalScore += smsRes.score;
            signals = signals.concat(smsRes.signals);
        } else if (hint === "url" || /^https?:\/\//i.test(rawText.trim())) {
            activePlatform = "url";
            var uRes = URLDetector.analyze(rawText.trim());
            totalScore += uRes.score;
            signals = signals.concat(uRes.findings.map(function(f){
                return { id: f.type, name: f.type, sub: f.text, weight: f.weight };
            }));
        } else {
            // General multi-layer sweep
            var gWa = WhatsAppDetector.analyze(rawText);
            var gSms = SMSDetector.analyze(rawText, "");
            totalScore = Math.max(gWa.score, gSms.score);
            signals = gWa.signals.concat(gSms.signals);
        }

        // Deduplicate signals by id
        var uniqueSignals = [];
        var seenIds = new Set();
        signals.forEach(function (s) {
            if (!seenIds.has(s.id)) {
                seenIds.add(s.id);
                uniqueSignals.push(s);
            }
        });

        var finalScore = Math.min(totalScore, 100);
        return ScamRiskScorer.computeVerdict(finalScore, uniqueSignals, activePlatform);
    }

    return {
        URLDetector: URLDetector,
        WhatsAppDetector: WhatsAppDetector,
        EmailDetector: EmailDetector,
        SMSDetector: SMSDetector,
        PhishingDetector: PhishingDetector,
        ScamRiskScorer: ScamRiskScorer,
        scan: scan,
        // Legacy backward compatibility alias
        evaluateMessageHeuristics: function(text) {
            var res = scan(text, "whatsapp");
            return {
                score: res.score,
                status: res.badgeText,
                category: res.category,
                signals: res.signals,
                actions: res.actions,
                explanation: res.explanation
            };
        },
        evaluateUrlHeuristics: function(url) {
            return URLDetector.analyze(url);
        }
    };
}));

