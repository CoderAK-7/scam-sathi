/**
 * ScamSathi Universal Scam Guardian - Detection Engine
 * Local-First Cybersecurity Heuristic Engine for Indian Phishing & Fraud Patterns
 * Problem Statement #02: PhishShield AI
 *
 * NOTE: This is a client-side, rule-based heuristic engine designed to safeguard
 * Indian citizens against prevalent social engineering tactics. It runs 100% locally
 * without sending messages, credentials, or private data to any remote server.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ScamSathiDetector = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const HINDI_TRANSLATIONS = {
        highRisk: "उच्च जोखिम (High Risk)",
        mediumRisk: "समीक्षा आवश्यक (Needs Review)",
        lowRisk: "कम जोखिम (Lower Risk)",
        categories: {
            "UPI Reverse-Payment / PIN Scam": "यूपीआई रिवर्स पेमेंट / पिन धोखाधड़ी",
            "Fake Electricity Bill & Malicious APK": "फर्जी बिजली बिल एवं खतरनाक APK मैलवेयर",
            "Banking Phishing & KYC Fraud": "बैंक फ़िशिंग एवं फर्जी KYC धोखाधड़ी",
            "Digital Arrest & Police Impersonation": "डिजिटल अरेस्ट एवं पुलिस प्रतिरूपण घोटाला",
            "Telegram Task & Job Scam": "टेलीग्राम पार्ट-टाइम जॉब व रेटिंग घोटाला",
            "Remote Screen Sharing Hijack": "स्क्रीन शेयरिंग / रिमोट एक्सेस खतरा",
            "Advance-Fee / Prize Fraud": "लॉटरी / इनाम व प्रोसेसिंग फीस धोखाधड़ी",
            "Brand Spoofing": "ब्रांड प्रतिरूपण (Brand Spoofing)",
            "Malicious Android APK Delivery": "दुर्भावनापूर्ण APK फ़ाइल डाउनलोड",
            "Suspicious Host / Raw IP Target": "असुरक्षित IP आधारित वेबसाइट",
            "Obfuscated Shortlink": "छुपा हुआ शॉर्टलिंक",
            "General Message Inspection": "संदेश सुरक्षा जांच",
            "Likely Legitimate / Low Risk": "संभावित रूप से सुरक्षित / कम जोखिम",
            "Suspicious Urgency / Phishing Flags": "संदिग्ध तात्कालिकता व फ़िशिंग संकेत"
        },
        actions: {
            upiPinNever: "पैसे पाने या रिफंड लेने के लिए कभी भी अपना 6-अंक या 4-अंक का UPI PIN दर्ज न करें।",
            discomOfficial: "बिजली बिल केवल अपनी राज्य बिजली बोर्ड (DISCOM) की आधिकारिक वेबसाइट या ऐप पर ही जांचें।",
            noApkInstall: "एसएमएस या व्हाट्सएप से डाउनलोड की गई किसी भी .apk फाइल को कभी इंस्टॉल न करें।",
            noDigitalArrest: "याद रखें: भारतीय कानून में 'डिजिटल अरेस्ट' का कोई प्रावधान नहीं है। पुलिस कभी स्काइप या व्हाट्सएप वीडियो कॉल पर गिरफ्तारी नहीं करती।",
            bankNoKycLink: "बैंक कभी भी एसएमएस लिंक के जरिए केवाईसी अपडेट करने को नहीं कहते। केवल आधिकारिक नेटबैंकिंग का उपयोग करें।",
            noAdvanceFee: "इनाम पाने के लिए कभी भी 'रिफंडेबल प्रोसेसिंग फीस' या अग्रिम राशि न भेजें।",
            call1930: "वित्तीय धोखाधड़ी होने पर तुरंत राष्ट्रीय साइबर हेल्पलाइन 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट करें।",
            verifyPadlock: "गोपनीय जानकारी दर्ज करने से पहले आधिकारिक वेबसाइट का स्पेलिंग व HTTPS लॉक जांचें।"
        }
    };

    // Sanitize credentials before displaying previews or storing locally
    function sanitizePreview(text) {
        if (!text) return "";
        let cleaned = String(text);
        cleaned = cleaned.replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, "[MASKED CARD]");
        cleaned = cleaned.replace(/\b(otp|code|pin)[:\s]+(\d{4,6})\b/gi, "$1 [MASKED]");
        cleaned = cleaned.replace(/\b\d{9,18}\b/g, (match) => {
            if (match.length >= 10 && match.length <= 12) return "[MASKED A/C]";
            return match;
        });
        return cleaned.slice(0, 200);
    }

    // =========================================================================
    // 1. URL HEURISTICS EVALUATOR
    // =========================================================================

    function evaluateUrlHeuristics(urlInput, hadExplicitHttp = false) {
        let normalizedUrl = String(urlInput || "").trim();
        if (!normalizedUrl) {
            return {
                score: 0,
                status: "Low Risk",
                category: "Empty URL",
                hostname: "",
                signals: [],
                explanation: "No URL provided for analysis.",
                actions: ["Ensure links are verified before opening."]
            };
        }

        const hasExplicitProtocol = /^https?:\/\//i.test(normalizedUrl);
        const explicitHttp = hadExplicitHttp || /^http:\/\//i.test(normalizedUrl);

        if (!hasExplicitProtocol) {
            normalizedUrl = "https://" + normalizedUrl;
        }

        let urlObj;
        try {
            urlObj = new URL(normalizedUrl);
        } catch {
            return {
                score: 45,
                status: "Needs Review",
                category: "Malformed URL Structure",
                hostname: normalizedUrl,
                signals: [{
                    name: "Malformed URL Syntax",
                    sub: "The URL structure cannot be reliably parsed by standard RFC specifications",
                    weight: 45
                }],
                explanation: "The provided web address is malformed and could be using obfuscation tricks to disguise its real destination.",
                actions: ["Do not paste or visit malformed links in your browser."]
            };
        }

        const hostname = urlObj.hostname.toLowerCase();
        const pathname = urlObj.pathname.toLowerCase();
        const fullHref = urlObj.href.toLowerCase();
        const signals = [];
        let score = 0;
        let category = "Domain Structure Verification";

        // Monitored Indian Brands & verified authorized domains
        const monitoredBrands = [
            { brand: "sbi", officials: ["onlinesbi.sbi", "sbi.co.in", "statebankofindia.com", "onlinesbi.com"], name: "State Bank of India (SBI)" },
            { brand: "yono", officials: ["onlinesbi.sbi", "sbi.co.in", "yono.sbi", "yonobusiness.sbi"], name: "SBI YONO Banking" },
            { brand: "hdfc", officials: ["hdfcbank.com"], name: "HDFC Bank" },
            { brand: "icici", officials: ["icicibank.com"], name: "ICICI Bank" },
            { brand: "pnb", officials: ["pnbindia.in"], name: "Punjab National Bank" },
            { brand: "axis", officials: ["axisbank.com"], name: "Axis Bank" },
            { brand: "paytm", officials: ["paytm.com"], name: "Paytm Payments" },
            { brand: "phonepe", officials: ["phonepe.com"], name: "PhonePe" },
            { brand: "gpay", officials: ["pay.google.com", "google.com", "gpay.app.goo.gl"], name: "Google Pay" },
            { brand: "indiapost", officials: ["indiapost.gov.in"], name: "India Post" },
            { brand: "incometax", officials: ["incometax.gov.in"], name: "Income Tax Department" },
            { brand: "aadhaar", officials: ["uidai.gov.in"], name: "UIDAI Aadhaar" }
        ];

        let brandImpersonated = null;
        monitoredBrands.forEach(item => {
            const brandRegex = new RegExp("(^|[.-])" + item.brand + "([.-]|$)", "i");
            if (brandRegex.test(hostname)) {
                const isOfficial = item.officials.some(off => hostname === off || hostname.endsWith("." + off));
                if (!isOfficial) {
                    brandImpersonated = item.name;
                    signals.push({
                        name: `Brand Impersonation (${item.name})`,
                        sub: `Hostname contains '${item.brand}' but does not match authorized domains (${item.officials.join(", ")})`,
                        weight: 45
                    });
                    score += 45;
                    category = `Brand Spoofing (${item.name})`;
                }
            }
        });

        // 2. Dangerous File Extensions
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
                sub: "Domain uses a direct numeric IP instead of a registered domain name (common in drive-by malware)",
                weight: 35
            });
            score += 35;
            if (!brandImpersonated) category = "Suspicious Host / Raw IP Target";
        }

        // 4. Insecure HTTP Protocol
        if (urlObj.protocol === "http:" && explicitHttp) {
            signals.push({
                name: "Unencrypted Connection (HTTP)",
                sub: "Website explicitly uses unencrypted HTTP instead of HTTPS",
                weight: 20
            });
            score += 20;
        }

        // 5. High-Risk Disposable TLDs
        const suspiciousTLDs = [".xyz", ".top", ".buzz", ".club", ".work", ".click", ".fit", ".online", ".site", ".icu", ".cam", ".tk", ".ml", ".ga", ".cf", ".vip"];
        const matchedTLD = suspiciousTLDs.find(tld => hostname.endsWith(tld));
        if (matchedTLD) {
            signals.push({
                name: `High-Risk TLD (${matchedTLD})`,
                sub: "Top-Level Domain frequently exploited by ephemeral phishing campaigns",
                weight: 25
            });
            score += 25;
        }

        // 6. URL Shortener Detection
        const shorteners = ["bit.ly", "tinyurl.com", "is.gd", "cutt.ly", "rb.gy", "t.co", "shorturl.at"];
        if (shorteners.some(s => hostname === s || hostname.endsWith("." + s))) {
            signals.push({
                name: "Obfuscated URL Shortener",
                sub: "Masks true destination; frequently abused in SMS and WhatsApp phishing",
                weight: 20
            });
            score += 20;
            if (score < 40) category = "Obfuscated Shortlink";
        }

        // 7. Excessive Subdomains
        const domainParts = hostname.split(".");
        if (domainParts.length > 4) {
            signals.push({
                name: "Unusually Deep Subdomain Nesting",
                sub: `Hostname has ${domainParts.length} levels, commonly used to hide fake domain roots`,
                weight: 15
            });
            score += 15;
        }

        // 8. Punycode / IDN Spoofing
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

        const explanation = finalScore >= 60
            ? `CRITICAL THREAT: This URL displays multiple high-confidence indicators of malicious intent (${signals.map(s => s.name).join(", ")}). The domain '${hostname}' appears designed to deceive users into submitting banking credentials or downloading malicious payloads.`
            : finalScore >= 30
            ? `SUSPICIOUS ELEMENTS IDENTIFIED: The URL structure contains warning flags such as non-standard TLDs, lack of HTTPS, or URL shortener masking. The host '${hostname}' does not match verified security profiles.`
            : `LOCAL CHECKS PASSED: The structural components of '${hostname}' appear standard with secure protocol and standard domain depth.`;

        const actions = finalScore >= 60
            ? [
                "DO NOT visit or open this link in your browser.",
                "Never enter banking passwords, OTPs, or credit card details on unverified domains.",
                "Report this link and sender to the 1930 Cyber Helpline or Chakshu (sancharsaathi.gov.in)."
            ]
            : finalScore >= 30
            ? [
                "Verify the organization by searching their official verified domain via a search engine.",
                "Avoid submitting payment cards or Aadhaar/PAN details on this webpage.",
                "Ensure HTTPS padlock is present and verified by a recognized Certificate Authority."
            ]
            : [
                "Always look for the browser lock icon on sensitive login pages.",
                "Remember that even legitimate websites can be compromised; verify URL spelling carefully."
            ];

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

    // =========================================================================
    // 2. MESSAGE HEURISTICS EVALUATOR
    // =========================================================================

    function evaluateMessageHeuristics(text, lang = "en") {
        const rawText = String(text || "");
        const lower = rawText.toLowerCase();
        const detectedSignals = [];
        const matchedKeywords = [];
        let cumulativeScore = 0;
        let category = "General Message Inspection";

        // 1. Critical UPI Reverse-Payment / PIN Traps
        const upiRules = [
            { pattern: /enter (your )?(upi )?pin to receive|pin daal(iye|e| kar) (paise|cashback) (lene|pane)/i, name: "UPI PIN Inversion Trap", desc: "Asking user to enter PIN to 'receive' money", points: 45, word: "enter pin to receive" },
            { pattern: /\bupi pin\b/i, name: "UPI PIN Mention", desc: "References UPI PIN in unsolicited message", points: 25, word: "upi pin" },
            { pattern: /claim (cashback|reward)|reward claim|scratch card|cashback reward/i, name: "Financial Reward / Cashback Bait", desc: "Unrealistic lucky draw or cashback promises", points: 25, word: "cashback reward" },
            { pattern: /paisa (lene|pane) ke liye/i, name: "Hinglish UPI Trap", desc: "Hinglish coercion to collect money via PIN", points: 35, word: "paisa lene ke liye" },
            { pattern: /phonepe|googlepay|\bgpay\b|paytm/i, name: "Payment App Impersonation", desc: "Names popular Indian wallet/UPI applications", points: 15, word: "payment app" }
        ];

        // 2. Fake Electricity Bill / Bijli Cut APK Scams
        const utilityRules = [
            { pattern: /\.apk\b/i, name: "Dangerous APK Sideloading", desc: "Direct download of Android APK executable", points: 40, word: ".apk file" },
            { pattern: /(electricity|power|bijli) (connection )?(will be |is being )?(disconnect|cut off|kat jayegi)|power (will be )?disconnect/i, name: "Utility Disconnection Threat", desc: "Fabricated urgent electricity shutdown warning", points: 35, word: "power disconnect" },
            { pattern: /bijli|power officer|unpaid bill|non-payment of (bill|kyc)|discom/i, name: "State Electricity Discom Spoof", desc: "Posing as power corporation officials", points: 25, word: "electricity bill" },
            { pattern: /tonight at 9:?30|urgent bill update|before \d+\s?(pm|am|hours)|by tonight/i, name: "Urgent Deadline Pressure", desc: "Creating artificial immediate deadline to force panic", points: 20, word: "urgent deadline" }
        ];

        // 3. Fake Bank KYC / YONO Account Suspended (Loosened to match real-world phrasing)
        const kycRules = [
            { pattern: /\byono\b|\bsbi\b|\bhdfc\b|\bicici\b|\bpnb\b|axis bank/i, name: "Major Bank Brand Name", desc: "References prominent Indian banking brand", points: 15, word: "bank name" },
            { pattern: /kyc (update|pending|expired|verification|required|incomplete|compliance|document)|pan (update|link|expired|verification)/i, name: "Urgent KYC / PAN Demanded", desc: "Demanding immediate KYC documentation update", points: 35, word: "kyc update" },
            { pattern: /account (is |has been |will be |may be )?(temporarily |permanently )?(blocked|suspended|deactivated|closed|frozen)|khata band/i, name: "Account Suspension Intimidation", desc: "Threatening freeze of savings or netbanking account", points: 30, word: "account blocked" },
            { pattern: /debit card blocked|atm blocked|card suspended/i, name: "Card Block Threat", desc: "False claim of ATM/Debit card blocking", points: 25, word: "card blocked" }
        ];

        // 4. Digital Arrest / Fake Law Enforcement
        const legalRules = [
            { pattern: /digital arrest/i, name: "Fabricated 'Digital Arrest' Coercion", desc: "Non-existent legal pretext used to terrorize victims", points: 45, word: "digital arrest" },
            { pattern: /\bcbi\b|crime branch|mumbai police|delhi police|customs department|narcotics bureau|\bed\b officer/i, name: "Law Enforcement Agency Spoof", desc: "Posing as central crime or intelligence agency", points: 35, word: "police/cbi" },
            { pattern: /arrest warrant|parcel seized|illegal parcel|drugs found in parcel|passports confiscated/i, name: "False Criminal Allegation", desc: "Claiming illegal drugs or seized contraband in courier", points: 30, word: "parcel seized" },
            { pattern: /skype (video )?call|video call verification|stay on (video|camera)/i, name: "Video Call Intimidation", desc: "Luring victim into staged police video call", points: 25, word: "skype video call" }
        ];

        // 5. Telegram Work-From-Home / Rating Task Scam
        const jobRules = [
            { pattern: /part[ -]time (job|work)|work from home/i, name: "Work-From-Home Bait", desc: "Unrealistic easy freelance income promises", points: 25, word: "part-time job" },
            { pattern: /like youtube|rate hotel|google maps review|subscribe channel/i, name: "Micro-Task Review Trap", desc: "Typical entry hook for task fraud", points: 30, word: "like youtube videos" },
            { pattern: /earn \d{3,5} daily|daily income \d+|per day \d{3,5}/i, name: "Exaggerated Daily Earnings", desc: "Promises of ₹2,000 - ₹10,000 daily payout", points: 25, word: "daily earnings" },
            { pattern: /telegram (vip )?group|t\.me\//i, name: "Redirection to Telegram", desc: "Moving conversation to unregulated channel", points: 20, word: "telegram group" }
        ];

        // 6. Remote Desktop Hijacking Apps
        const remoteRules = [
            { pattern: /anydesk|rustdesk|teamviewer|quicksupport/i, name: "Remote Desktop Tool Solicitation", desc: "Attempting to gain full screen and SMS OTP control", points: 45, word: "anydesk / remote app" }
        ];

        // 7. Advance-Fee / Prize / Lottery Fraud (NEW comprehensive rule group)
        const prizeFraudRules = [
            { pattern: /congratulations.*(won|selected|winner)|lucky draw winner|selected as (the )?winner/i, name: "Lottery / Prize Win Bait", desc: "Unsolicited notification claiming recipient won a lottery or prize", points: 30, word: "prize winner" },
            { pattern: /refundable (processing )?fee|processing fee|registration fee|activation charge|claim fee/i, name: "Advance-Fee / Processing Fee Demand", desc: "Demanding upfront fee before releasing fictitious reward", points: 40, word: "processing fee" },
            { pattern: /ifsc|account number|a\/c no|send to account/i, name: "Personal Bank Account Transfer Request", desc: "Requests funds transfer directly to a personal bank account", points: 30, word: "bank details in text" },
            { pattern: /@gmail\.com|@yahoo\.com|@hotmail\.com/i, name: "Free Webmail Posing as Organization", desc: "Official notices using public Gmail/Yahoo addresses", points: 20, word: "free webmail address" }
        ];

        // 8. General Credential & Urgency Markers
        const generalRules = [
            { pattern: /\botp\b|one time password/i, name: "OTP Solicitation Mention", desc: "References one-time passwords", points: 25, word: "otp" },
            { pattern: /password|login credentials|\bpin\b/i, name: "Secret Credential Target", desc: "Mentions passwords or secret PINs", points: 20, word: "password" },
            { pattern: /immediately|within 24 hours|jaldi karo|urgent|urgently|today itself/i, name: "Psychological Time Pressure", desc: "Short deadline intended to bypass logical thinking", points: 15, word: "urgency language" },
            { pattern: /http:\/\/|https:\/\/|bit\.ly|tinyurl/i, name: "Embedded Web Link", desc: "Contains external link in message", points: 15, word: "embedded link" }
        ];

        // Run Rule Sets
        const allRuleSets = [
            { rules: utilityRules, cat: "Fake Electricity Bill & Malicious APK" },
            { rules: upiRules, cat: "UPI Reverse-Payment / PIN Scam" },
            { rules: legalRules, cat: "Digital Arrest & Police Impersonation" },
            { rules: kycRules, cat: "Banking Phishing & KYC Fraud" },
            { rules: jobRules, cat: "Telegram Task & Job Scam" },
            { rules: remoteRules, cat: "Remote Screen Sharing Hijack" },
            { rules: prizeFraudRules, cat: "Advance-Fee / Prize Fraud" },
            { rules: generalRules, cat: null }
        ];

        const categoryMatches = {};

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

        // 9. Inline URL Evaluation: Extract any embedded URL and evaluate its domain
        const urlMatch = rawText.match(/https?:\/\/[^\s"'<>]+/i) || rawText.match(/\b(?:www\.)[^\s"'<>]+/i);
        if (urlMatch) {
            try {
                const inlineUrlAnalysis = evaluateUrlHeuristics(urlMatch[0]);
                if (inlineUrlAnalysis.score >= 60) {
                    cumulativeScore += 30;
                    detectedSignals.push({
                        name: "High-Risk Embedded URL Target",
                        sub: `Embedded link flagged as ${inlineUrlAnalysis.category} (${inlineUrlAnalysis.hostname})`,
                        weight: 30
                    });
                } else if (inlineUrlAnalysis.score >= 30) {
                    cumulativeScore += 15;
                    detectedSignals.push({
                        name: "Suspicious Embedded URL Characteristics",
                        sub: `Embedded link has questionable characteristics (${inlineUrlAnalysis.hostname})`,
                        weight: 15
                    });
                }
            } catch {
                // Ignore URL parsing errors
            }
        }

        // 10. Co-occurrence / Synergistic Fraud Signal Boost
        if ((categoryMatches["Banking Phishing & KYC Fraud"] || 0) >= 45) cumulativeScore += 15;
        if ((categoryMatches["Fake Electricity Bill & Malicious APK"] || 0) >= 50) cumulativeScore += 15;
        if ((categoryMatches["Advance-Fee / Prize Fraud"] || 0) >= 50) cumulativeScore += 15;

        // Determine primary category
        let maxCatPoints = 0;
        for (let c in categoryMatches) {
            if (categoryMatches[c] > maxCatPoints) {
                maxCatPoints = categoryMatches[c];
                category = c;
            }
        }

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

        // Explanations in English & Hindi
        const isHindi = lang === "hi";
        const explanation = getExplanation(finalScore, category, isHindi);
        const actions = getActions(finalScore, category, isHindi);

        return {
            score: finalScore,
            status: isHindi ? (finalScore >= 60 ? HINDI_TRANSLATIONS.highRisk : finalScore >= 30 ? HINDI_TRANSLATIONS.mediumRisk : HINDI_TRANSLATIONS.lowRisk) : status,
            category: isHindi ? (HINDI_TRANSLATIONS.categories[category] || category) : category,
            rawStatus: status,
            signals: detectedSignals,
            keywords: Array.from(new Set(matchedKeywords)),
            explanation,
            actions
        };
    }

    function getExplanation(score, category, isHindi) {
        if (score >= 60) {
            if (category.includes("UPI")) {
                return isHindi
                    ? "गंभीर चेतावनी: यह संदेश यूपीआई पिन धोखाधड़ी के स्पष्ट संकेत दर्शाता है। जालसाज आपको कैशबैक या इनाम का लालच देकर आपका यूपीआई पिन दर्ज कराने का प्रयास कर रहे हैं। ध्यान रहे: यूपीआई में पैसे प्राप्त करने के लिए कभी भी पिन की आवश्यकता नहीं होती।"
                    : "CRITICAL ALERT: This message exhibits classic signs of a UPI Inversion fraud. The sender is attempting to deceive you into believing you will receive money, but will actually prompt you to enter your UPI PIN. Entering your PIN always authorises an immediate debit from your account.";
            } else if (category.includes("Electricity")) {
                return isHindi
                    ? "उच्च जोखिम मैलवेयर चेतावनी: यह संदेश 'बिजली बिल न भरने पर रात 9:30 बजे बिजली कटने' वाले बड़े साइबर गिरोह का जाल है। इसमें दी गई लिंक से एक खतरनाक एंड्रॉइड .apk फाइल डाउनलोड होती है जो आपके बैंकिंग ओटीपी चुरा सकती है।"
                    : "HIGH RISK MALWARE ATTEMPT: This message uses the widespread 'Electricity Disconnection' template. The link downloads an Android .apk file. When installed, this spyware intercepts banking SMS and OTPs to drain accounts.";
            } else if (category.includes("Digital Arrest")) {
                return isHindi
                    ? "अत्यधिक गंभीर धमकी घोटाला: यह संदेश 'डिजिटल अरेस्ट' नाम से ब्लैकमेल करने का प्रयास है। जालसाज पुलिस या सीबीआई बनकर पार्सल में नशीले पदार्थ मिलने का झूठा दावा करते हैं। भारतीय कानून में वीडियो कॉल पर 'डिजिटल अरेस्ट' का कोई नियम नहीं है।"
                    : "EXTREME INTIMIDATION SCAM: This message attempts 'Digital Arrest' extortion. Fraudsters impersonate CBI, Police, or Customs officers threatening arrest over a fictitious courier parcel. Indian law enforcement never conducts arrests via Skype or video calls.";
            } else if (category.includes("KYC")) {
                return isHindi
                    ? "बैंक फ़िशिंग चेतावनी: यह संदेश किसी प्रमुख बैंक या एसबीआई योनो के नाम से फर्जी चेतावनी देकर खाता बंद होने का डर दिखाता है। लिंक पर क्लिक करने से आपके नेटबैंकिंग यूजरनेम, पासवर्ड और ओटीपी की चोरी हो सकती है।"
                    : "BANK PHISHING DETECTED: This message impersonates a major bank claiming your account or NetBanking access will be blocked unless KYC/PAN is updated. The target link is a clone designed to capture your login credentials and OTP.";
            } else if (category.includes("Prize") || category.includes("Advance-Fee")) {
                return isHindi
                    ? "लॉटरी / अग्रिम फीस घोटाला: यह संदेश फर्जी इनाम का लालच देकर 'रिफंडेबल प्रोसेसिंग फीस' के नाम पर पैसे ऐंठने का प्रयास है। कोई भी वास्तविक कंपनी पुरस्कार देने के लिए अग्रिम भुगतान नहीं मांगती।"
                    : "ADVANCE-FEE PRIZE FRAUD: This message attempts 419 lottery fraud. It offers a large cash prize or reward but demands a 'refundable processing fee' or bank transfer first. Legitimate lotteries never demand upfront fees.";
            } else {
                return isHindi
                    ? "उच्च जोखिम वाले संदिग्ध संकेत: इस संदेश में अत्यधिक तात्कालिकता, वित्तीय प्रलोभन या संदिग्ध लिंक जैसे गंभीर खतरे के संकेत पाए गए हैं।"
                    : "HIGH RISK SCAM SIGNALS: Multiple high-severity fraud indicators were identified, including unsolicited financial offers, deceptive links, or pressure tactics intended to prevent calm verification.";
            }
        } else if (score >= 30) {
            return isHindi
                ? "मध्यम जोखिम - सावधानी बरतें: इस संदेश में तात्कालिकता पैदा करने वाले शब्द या अनचाहे लिंक मौजूद हैं जो आम तौर पर फ़िशिंग संदेशों में उपयोग होते हैं।"
                : "MODERATE RISK - EXERCISE CAUTION: While this message may not contain an explicit malicious payload, it features urgency keywords, unsolicited prompts, or generic links that resemble known phishing vectors.";
        } else {
            return isHindi
                ? "कम जोखिम संकेत: इस संदेश में कोई स्पष्ट फ़िशिंग या साइबर धोखाधड़ी के संकेत नहीं मिले हैं। यह सामान्य सूचना जैसा प्रतीत होता है।"
                : "LOW RISK DETECTED: No prominent phishing or fraud keywords were found in this text. It appears consistent with standard notification formats or everyday communication.";
        }
    }

    function getActions(score, category, isHindi) {
        if (score >= 60) {
            return isHindi
                ? [
                    HINDI_TRANSLATIONS.actions.upiPinNever,
                    HINDI_TRANSLATIONS.actions.noApkInstall,
                    HINDI_TRANSLATIONS.actions.bankNoKycLink,
                    HINDI_TRANSLATIONS.actions.call1930
                ]
                : [
                    "NEVER enter your UPI PIN on any collect request or QR code to receive money.",
                    "Do NOT click any link or install any .apk file downloaded from SMS or chat.",
                    "Verify billing or KYC issues directly on official portal or bank branch in person.",
                    "If financial loss has occurred, dial National Cyber Helpline 1930 immediately or visit cybercrime.gov.in."
                ];
        } else if (score >= 30) {
            return isHindi
                ? [
                    "प्रेषक की पहचान स्वतंत्र और आधिकारिक चैनलों के माध्यम से सत्यापित करें।",
                    "किसी के साथ भी अपना ओटीपी, पासवर्ड या पहचान पत्र साझा न करें।",
                    "किसी भी लिंक पर क्लिक करने से पहले उसे यूआरएल स्कैनर में जांचें।"
                ]
                : [
                    "Verify the sender's identity through independent, official channels.",
                    "Do not share OTPs, passwords, or personal identity documents.",
                    "Inspect any links carefully in our URL Scanner before clicking."
                ];
        } else {
            return isHindi
                ? [
                    "हमेशा सतर्क रहें: बैंक पासवर्ड या डेबिट कार्ड पिन किसी से साझा न करें।",
                    "अपने बैंक खाते के अलर्ट और एसएमएस पर नियमित नजर रखें।"
                ]
                : [
                    "Maintain standard cyber hygiene: never share passwords or full debit card PINs.",
                    "Always verify transaction alerts against your personal account activity."
                ];
        }
    }

    return {
        evaluateMessageHeuristics,
        evaluateUrlHeuristics,
        sanitizePreview,
        HINDI_TRANSLATIONS
    };
}));

