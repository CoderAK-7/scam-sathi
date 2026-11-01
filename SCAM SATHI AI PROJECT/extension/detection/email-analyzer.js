// @ts-nocheck
/**
 * ScamSathi MailGuard AI - Email Content Analyzer
 * Modular heuristic engine for detecting scam/phishing emails.
 * Exports: window.MailGuardAnalyzer
 * Pattern: IIFE, no ES modules.
 */

window.MailGuardAnalyzer = (function () {

  // ── Helpers ────────────────────────────────────────────────────────────────

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalise(text) {
    return (text || '').toLowerCase();
  }

  function countMatches(text, keywords) {
    var count = 0;
    var lc = normalise(text);
    keywords.forEach(function (kw) {
      if (lc.indexOf(kw.toLowerCase()) !== -1) count++;
    });
    return count;
  }

  // ── Trusted domain whitelist ───────────────────────────────────────────────

  function getTrustedDomains() {
    return [
      // Indian banks
      'sbi.co.in', 'onlinesbi.sbi', 'hdfcbank.com', 'icicibank.com',
      'axisbank.com', 'pnbindia.in', 'bankofbaroda.in', 'canarabank.com',
      'unionbankofindia.com', 'kotak.com', 'yesbank.in', 'idfcfirstbank.com',
      'indusind.com', 'federalbank.co.in',
      // Indian payments & fintech
      'paytm.com', 'phonepe.com', 'gpay.com', 'bhimupi.org.in', 'npci.org.in',
      'razorpay.com', 'instamojo.com', 'mobikwik.com',
      // Indian government
      'gov.in', 'nic.in', 'uidai.gov.in', 'incometax.gov.in',
      'trai.gov.in', 'rbi.org.in', 'irdai.gov.in', 'sebi.gov.in',
      // Global tech / e-commerce
      'google.com', 'gmail.com', 'microsoft.com', 'live.com', 'outlook.com',
      'apple.com', 'amazon.in', 'amazon.com', 'flipkart.com', 'myntra.com',
      'paypal.com', 'linkedin.com', 'twitter.com', 'facebook.com',
      'instagram.com', 'youtube.com', 'netflix.com',
      // Courier
      'indiapost.gov.in', 'delhivery.com', 'bluedart.com',
      'dtdc.com', 'fedex.com', 'dhl.com', 'ekart.com'
    ];
  }

  // Brand → official domain(s) mapping for sender-mismatch check
  var BRAND_DOMAIN_MAP = {
    'sbi':           ['sbi.co.in', 'onlinesbi.sbi'],
    'state bank':    ['sbi.co.in', 'onlinesbi.sbi'],
    'hdfc':          ['hdfcbank.com'],
    'icici':         ['icicibank.com'],
    'axis bank':     ['axisbank.com'],
    'pnb':           ['pnbindia.in'],
    'punjab national': ['pnbindia.in'],
    'paypal':        ['paypal.com'],
    'amazon':        ['amazon.in', 'amazon.com'],
    'google':        ['google.com', 'gmail.com'],
    'microsoft':     ['microsoft.com', 'live.com', 'outlook.com'],
    'aadhaar':       ['uidai.gov.in'],
    'uidai':         ['uidai.gov.in'],
    'income tax':    ['incometax.gov.in'],
    'it department': ['incometax.gov.in'],
    'trai':          ['trai.gov.in'],
    'rbi':           ['rbi.org.in'],
    'npci':          ['npci.org.in'],
    'paytm':         ['paytm.com'],
    'phonepe':       ['phonepe.com']
  };

  // ── Rule definitions ───────────────────────────────────────────────────────

  var RULES = [
    {
      id: 'urgency',
      name: 'Urgency / Pressure Language',
      description: 'Email uses time-pressure or alarm language to provoke hasty action.',
      maxScore: 25,
      perMatchScore: 10,
      keywords: [
        'action required', 'immediate', '24 hours', 'expires', 'suspended',
        'blocked', 'verify now', 'confirm immediately', 'act now', 'urgent',
        'last chance', 'account will be closed', 'respond immediately',
        'without delay', 'as soon as possible', 'time sensitive'
      ]
    },
    {
      id: 'impersonation',
      name: 'Brand / Institution Impersonation',
      description: 'Email claims to be from a known bank, government body, or tech brand.',
      maxScore: 20,
      perMatchScore: 20,
      keywords: [
        'sbi', 'hdfc', 'icici', 'axis bank', 'pnb', 'paypal', 'amazon',
        'google', 'microsoft', 'aadhaar', 'uidai', 'income tax',
        'it department', 'trai', 'rbi', 'npci', 'paytm', 'phonepe',
        'state bank of india', 'bank of baroda', 'canara bank',
        'post office', 'india post'
      ]
    },
    {
      id: 'kyc',
      name: 'KYC / Account Update Scam',
      description: 'Asks to update KYC details, link Aadhaar, or submit documents.',
      maxScore: 15,
      perMatchScore: 15,
      keywords: [
        'kyc update', 'kyc verification', 'link your aadhaar',
        'link aadhaar', 'update account', 'reactivate account',
        'submit documents', 'verify identity', 'otp', 'one time password',
        'complete your kyc', 'mandatory kyc', 'kyc expired'
      ]
    },
    {
      id: 'prize',
      name: 'Prize / Lottery Fraud',
      description: 'Claims the recipient has won money, prizes, or free gifts.',
      maxScore: 20,
      perMatchScore: 20,
      keywords: [
        'you have won', 'you won', 'winner', 'lottery', 'selected',
        'prize', 'claim reward', 'congratulations you won',
        'free gift', 'claim your prize', 'lucky draw', 'bumper prize',
        'you are a winner', 'collect your reward'
      ]
    },
    {
      id: 'job_scam',
      name: 'Fake Job / Work-From-Home Scam',
      description: 'Promotes unrealistic work-from-home or easy-income schemes.',
      maxScore: 15,
      perMatchScore: 15,
      keywords: [
        'work from home', 'earn per day', 'unlimited income',
        'no experience required', 'part time job', 'high salary guaranteed',
        'earn daily', 'easy money', 'earn from mobile', 'online earning',
        'data entry job', 'part-time work', 'guaranteed income'
      ]
    },
    {
      id: 'phishing',
      name: 'Password / Account Phishing',
      description: 'Attempts to steal login credentials or trigger password resets.',
      maxScore: 15,
      perMatchScore: 15,
      keywords: [
        'reset password', 'account locked', 'unusual sign-in',
        'unusual signin', 'security alert', 'verify your email',
        'confirm account', 'login attempt', 'suspicious activity',
        'change your password', 'click to verify', 'confirm your identity'
      ]
    },
    {
      id: 'payment_fraud',
      name: 'Advance Fee / Payment Fraud',
      description: 'Requests money transfers, advance fees, or processing charges.',
      maxScore: 20,
      perMatchScore: 20,
      keywords: [
        'send money', 'transfer funds', 'wire transfer',
        'advance fee', 'processing fee', 'refundable deposit',
        'release fee', 'transfer charge', 'handling fee',
        'pay now to receive', 'small fee', 'nominal fee'
      ]
    },
    {
      id: 'attachment',
      name: 'Malicious Attachment Reference',
      description: 'Prompts the user to download or open potentially dangerous files.',
      maxScore: 15,
      perMatchScore: 15,
      keywords: [
        'download attached', 'open the attachment', 'open attachment',
        '.apk', '.exe', '.zip file', 'attached file', 'see attachment',
        'refer attached', 'download the file', 'install the app',
        'download apk', 'attached invoice'
      ]
    }
  ];

  // ── Individual checks ──────────────────────────────────────────────────────

  function checkKeywordRule(rule, text) {
    var matched = [];
    var lc = normalise(text);
    rule.keywords.forEach(function (kw) {
      if (lc.indexOf(kw.toLowerCase()) !== -1) matched.push(kw);
    });
    var rawScore = matched.length * rule.perMatchScore;
    var score = Math.min(rawScore, rule.maxScore);
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      weight: score,
      matched: matched.length > 0,
      matchedKeywords: matched
    };
  }

  function checkExcessiveCaps(text) {
    var words = (text || '').split(/\s+/);
    var capsWords = words.filter(function (w) {
      return w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w);
    });
    var matched = capsWords.length > 3;
    return {
      id: 'caps',
      name: 'Excessive Capitalisation',
      description: 'More than 3 ALL-CAPS words — common in scam messages.',
      weight: matched ? 5 : 0,
      matched: matched,
      matchedKeywords: []
    };
  }

  function checkSenderMismatch(senderName, senderEmail) {
    var lowerName = normalise(senderName);
    var emailDomain = '';
    if (senderEmail && senderEmail.indexOf('@') !== -1) {
      emailDomain = senderEmail.split('@')[1].toLowerCase().trim();
    }
    if (!emailDomain) {
      return { id: 'sender_mismatch', name: 'Sender Domain Mismatch', description: 'Sender email domain does not match the claimed brand.', weight: 0, matched: false, matchedKeywords: [] };
    }

    var mismatchFound = false;
    var brandFound = '';
    var brands = Object.keys(BRAND_DOMAIN_MAP);
    for (var i = 0; i < brands.length; i++) {
      var brand = brands[i];
      if (lowerName.indexOf(brand) !== -1) {
        var officialDomains = BRAND_DOMAIN_MAP[brand];
        var domainMatch = officialDomains.some(function (od) {
          return emailDomain === od || emailDomain.endsWith('.' + od);
        });
        if (!domainMatch) {
          mismatchFound = true;
          brandFound = brand;
          break;
        }
      }
    }

    return {
      id: 'sender_mismatch',
      name: 'Sender Domain Mismatch',
      description: 'Sender name claims to be "' + escapeHTML(brandFound) + '" but email domain is "' + escapeHTML(emailDomain) + '".',
      weight: mismatchFound ? 25 : 0,
      matched: mismatchFound,
      matchedKeywords: mismatchFound ? [brandFound + ' / ' + emailDomain] : []
    };
  }

  function checkUrlSignals(links) {
    if (!links || links.length === 0) {
      return { id: 'url_signals', name: 'Suspicious URLs', description: 'No URLs found in email body.', weight: 0, matched: false, matchedKeywords: [], urlFindings: [] };
    }
    var urlAnalyzer = window.MailGuardUrlAnalyzer;
    if (!urlAnalyzer) {
      return { id: 'url_signals', name: 'Suspicious URLs', description: 'URL analyzer not loaded.', weight: 0, matched: false, matchedKeywords: [], urlFindings: [] };
    }
    var findings = urlAnalyzer.analyzeAll(links);
    var dangerousCount = 0;
    var suspiciousCount = 0;
    findings.forEach(function (f) {
      if (f.risk === 'dangerous') dangerousCount++;
      else if (f.risk === 'suspicious') suspiciousCount++;
    });
    var score = Math.min((dangerousCount * 20) + (suspiciousCount * 10), 30);
    var matched = dangerousCount > 0 || suspiciousCount > 0;
    return {
      id: 'url_signals',
      name: 'Suspicious URLs',
      description: dangerousCount + ' dangerous and ' + suspiciousCount + ' suspicious URLs detected.',
      weight: score,
      matched: matched,
      matchedKeywords: [],
      urlFindings: findings
    };
  }

  function analyseSender(senderName, senderEmail) {
    var trusted = false;
    var reason = 'Unknown sender.';
    if (!senderEmail) {
      return { trusted: false, reason: 'No sender email address available.' };
    }
    var emailDomain = '';
    if (senderEmail.indexOf('@') !== -1) {
      emailDomain = senderEmail.split('@')[1].toLowerCase().trim();
    }
    var trustedDomains = getTrustedDomains();
    for (var i = 0; i < trustedDomains.length; i++) {
      if (emailDomain === trustedDomains[i] || emailDomain.endsWith('.' + trustedDomains[i])) {
        trusted = true;
        reason = 'Sender domain "' + emailDomain + '" is in the trusted whitelist.';
        break;
      }
    }
    if (!trusted) {
      reason = 'Sender domain "' + emailDomain + '" is not in the trusted whitelist.';
    }
    return { trusted: trusted, reason: reason };
  }

  function scoreToRisk(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'suspicious';
    return 'low';
  }

  function buildExplanation(risk, category, signals) {
    var matched = signals.filter(function (s) { return s.matched; });
    if (risk === 'low') {
      return 'No significant scam indicators detected. This email appears safe, but always verify sender identity for sensitive requests.';
    }
    var names = matched.map(function (s) { return s.name; }).join(', ');
    if (risk === 'suspicious') {
      return 'This email shows some suspicious patterns: ' + names + '. Proceed with caution and verify before clicking any links or sharing information.';
    }
    if (risk === 'high') {
      return 'This email shows multiple high-risk scam indicators: ' + names + '. Do NOT click any links or provide personal information. Verify through official channels.';
    }
    return 'CRITICAL THREAT DETECTED. This email matches known scam patterns: ' + names + '. Delete immediately and report to cybercrime.gov.in or call 1930.';
  }

  function buildActions(risk, signals) {
    var actions = [];
    if (risk === 'low') {
      actions.push('No immediate action required. Stay vigilant.');
      return actions;
    }
    if (risk === 'suspicious') {
      actions.push('Do not click unverified links in this email.');
      actions.push('Verify sender identity through official website or phone number.');
      return actions;
    }
    actions.push('Do NOT click any links or download attachments.');
    actions.push('Do NOT share OTPs, passwords, or personal details.');
    actions.push('Report this email as phishing/spam in Gmail.');
    if (risk === 'critical') {
      actions.push('Report to the National Cyber Crime Portal: cybercrime.gov.in');
      actions.push('Helpline: Dial 1930 (National Cyber Helpline)');
    }
    return actions;
  }

  function detectCategory(signals) {
    var matchedIds = signals.filter(function (s) { return s.matched; }).map(function (s) { return s.id; });
    if (matchedIds.indexOf('prize') !== -1) return 'Lottery / Prize Fraud';
    if (matchedIds.indexOf('payment_fraud') !== -1) return 'Advance Fee / Payment Fraud';
    if (matchedIds.indexOf('kyc') !== -1) return 'KYC / Banking Scam';
    if (matchedIds.indexOf('impersonation') !== -1) return 'Brand / Institution Impersonation';
    if (matchedIds.indexOf('phishing') !== -1) return 'Credential Phishing';
    if (matchedIds.indexOf('job_scam') !== -1) return 'Fake Job / Work-From-Home Scam';
    if (matchedIds.indexOf('attachment') !== -1) return 'Malware / Attachment Threat';
    if (matchedIds.indexOf('sender_mismatch') !== -1) return 'Sender Spoofing';
    if (matchedIds.indexOf('urgency') !== -1) return 'Urgency / Pressure Tactic';
    if (matchedIds.indexOf('url_signals') !== -1) return 'Phishing Link';
    return 'General Suspicious Email';
  }

  // ── Main analyze function ──────────────────────────────────────────────────

  function analyze(emailData) {
    var subject = emailData.subject || '';
    var body = emailData.body || '';
    var senderName = emailData.senderName || '';
    var senderEmail = emailData.senderEmail || '';
    var links = emailData.links || [];

    var combinedText = subject + ' ' + body;

    var signals = [];

    // Rule-based checks
    RULES.forEach(function (rule) {
      signals.push(checkKeywordRule(rule, combinedText));
    });

    // Excessive caps
    signals.push(checkExcessiveCaps(combinedText));

    // Sender mismatch
    signals.push(checkSenderMismatch(senderName, senderEmail));

    // URL analysis (injected as separate signal + urlFindings)
    var urlSignal = checkUrlSignals(links);
    signals.push(urlSignal);

    // Accumulate total score (cap at 100)
    var totalScore = 0;
    signals.forEach(function (s) {
      totalScore += (s.weight || 0);
    });
    totalScore = Math.min(totalScore, 100);
    totalScore = Math.max(totalScore, 0);

    var risk = scoreToRisk(totalScore);
    var category = detectCategory(signals);
    var explanation = buildExplanation(risk, category, signals);
    var actions = buildActions(risk, signals);
    var senderAnalysis = analyseSender(senderName, senderEmail);
    var urlFindings = urlSignal.urlFindings || [];

    return {
      score: totalScore,
      risk: risk,
      category: category,
      signals: signals,
      urlFindings: urlFindings,
      senderAnalysis: senderAnalysis,
      explanation: explanation,
      actions: actions
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    analyze: analyze,
    getTrustedDomains: getTrustedDomains
  };

})();
