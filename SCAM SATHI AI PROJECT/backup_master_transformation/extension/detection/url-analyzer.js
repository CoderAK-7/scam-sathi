// @ts-nocheck
/**
 * ScamSathi MailGuard AI - URL Analyzer
 * Checks individual URLs for phishing / malware indicators.
 * Exports: window.MailGuardUrlAnalyzer
 * Pattern: IIFE, no ES modules.
 */

window.MailGuardUrlAnalyzer = (function () {

  // ── Known URL shortener hosts ──────────────────────────────────────────────
  var URL_SHORTENERS = [
    'bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'goo.gl',
    'rb.gy', 'cutt.ly', 'is.gd', 'tiny.cc', 'shorturl.at',
    'clck.ru', 'bl.ink', 'buff.ly', 'dlvr.it', 'ift.tt',
    'po.st', 's.id', 'snip.ly', 'tr.im', 'url.ie'
  ];

  // ── Suspicious TLDs ────────────────────────────────────────────────────────
  var SUSPICIOUS_TLDS = [
    '.xyz', '.tk', '.ml', '.ga', '.cf', '.click',
    '.download', '.loan', '.gq', '.top', '.work',
    '.men', '.bid', '.win', '.review', '.trade',
    '.stream', '.racing', '.accountant', '.faith',
    '.date', '.cricket', '.science', '.party'
  ];

  // ── Phishing path keywords ─────────────────────────────────────────────────
  var PHISHING_PATH_KEYWORDS = [
    '/login', '/verify', '/update', '/secure', '/account',
    '/kyc', '/otp', '/signin', '/validation', '/confirm',
    '/authenticate', '/security', '/recover', '/unlock',
    '/password', '/credential', '/banking', '/netbanking'
  ];

  // ── Brand names that should NOT appear as subdomains of other roots ────────
  var BRAND_NAMES = [
    'sbi', 'hdfc', 'icici', 'axis', 'paypal', 'amazon',
    'google', 'microsoft', 'paytm', 'uidai', 'npci',
    'phonepe', 'flipkart', 'netflix', 'apple'
  ];

  // Brand → their official root domains
  var BRAND_OFFICIAL_ROOTS = {
    'sbi': ['sbi.co.in', 'onlinesbi.sbi'],
    'hdfc': ['hdfcbank.com'],
    'icici': ['icicibank.com'],
    'axis': ['axisbank.com'],
    'paypal': ['paypal.com'],
    'amazon': ['amazon.in', 'amazon.com'],
    'google': ['google.com', 'googleapis.com', 'googleusercontent.com'],
    'microsoft': ['microsoft.com', 'live.com', 'outlook.com', 'office.com'],
    'paytm': ['paytm.com'],
    'uidai': ['uidai.gov.in'],
    'npci': ['npci.org.in'],
    'phonepe': ['phonepe.com'],
    'flipkart': ['flipkart.com'],
    'netflix': ['netflix.com'],
    'apple': ['apple.com', 'icloud.com']
  };

  // ── Safe-list: well-known CDN / analytics that often appear in emails ──────
  var SAFE_DOMAINS = [
    'google.com', 'googleapis.com', 'googleusercontent.com',
    'gstatic.com', 'youtube.com', 'gmail.com',
    'microsoft.com', 'live.com', 'outlook.com', 'office.com', 'office365.com',
    'amazon.com', 'amazon.in', 'amazonses.com',
    'apple.com', 'icloud.com',
    'github.com', 'githubusercontent.com',
    'wikipedia.org', 'wikimedia.org',
    'twitter.com', 'x.com', 'linkedin.com', 'facebook.com',
    'instagram.com', 'whatsapp.com',
    'sbi.co.in', 'onlinesbi.sbi', 'hdfcbank.com', 'icicibank.com',
    'axisbank.com', 'pnbindia.in', 'paytm.com', 'phonepe.com',
    'flipkart.com', 'myntra.com', 'snapdeal.com',
    'gov.in', 'nic.in', 'uidai.gov.in', 'incometax.gov.in',
    'npci.org.in', 'bhimupi.org.in', 'rbi.org.in',
    'indiapost.gov.in', 'delhivery.com', 'bluedart.com',
    'netflix.com', 'hotstar.com', 'jio.com', 'airtel.in',
    'unsubscribe.example.com'  // placeholder — real unsubscribes use brand domain
  ];

  // ── Helper: safe domain check ──────────────────────────────────────────────
  function isSafeDomain(hostname) {
    var lh = (hostname || '').toLowerCase();
    for (var i = 0; i < SAFE_DOMAINS.length; i++) {
      var sd = SAFE_DOMAINS[i];
      if (lh === sd || lh.endsWith('.' + sd)) return true;
    }
    return false;
  }

  // ── Parse hostname from URL string ────────────────────────────────────────
  function getHostname(url) {
    try {
      // Handle protocol-relative URLs
      var normalised = url;
      if (normalised.indexOf('://') === -1 && normalised.indexOf('//') === 0) {
        normalised = 'https:' + normalised;
      }
      var a = document.createElement('a');
      a.href = normalised;
      return a.hostname.toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function getProtocol(url) {
    try {
      var a = document.createElement('a');
      a.href = url;
      return a.protocol.toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function getPathname(url) {
    try {
      var a = document.createElement('a');
      a.href = url;
      return a.pathname.toLowerCase();
    } catch (e) {
      return '';
    }
  }

  // ── Raw IP detection ───────────────────────────────────────────────────────
  function isRawIp(hostname) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  }

  // ── Shortener check ────────────────────────────────────────────────────────
  function isShortener(hostname) {
    return URL_SHORTENERS.some(function (sh) {
      return hostname === sh || hostname.endsWith('.' + sh);
    });
  }

  // ── Suspicious TLD check ───────────────────────────────────────────────────
  function hasSuspiciousTld(hostname) {
    return SUSPICIOUS_TLDS.some(function (tld) {
      return hostname.endsWith(tld);
    });
  }

  // ── Brand-in-subdomain check ───────────────────────────────────────────────
  function isBrandSubdomainSpoof(hostname) {
    for (var i = 0; i < BRAND_NAMES.length; i++) {
      var brand = BRAND_NAMES[i];
      if (hostname.indexOf(brand) === -1) continue;
      var officialRoots = BRAND_OFFICIAL_ROOTS[brand] || [];
      var onOfficialRoot = officialRoots.some(function (root) {
        return hostname === root || hostname.endsWith('.' + root);
      });
      if (!onOfficialRoot) {
        return brand;
      }
    }
    return null;
  }

  // ── Hyphen check ───────────────────────────────────────────────────────────
  function hasExcessiveHyphens(hostname) {
    var hyphens = (hostname.match(/-/g) || []).length;
    return hyphens >= 3;
  }

  // ── Long hostname check ───────────────────────────────────────────────────
  function hasLongHostname(hostname) {
    return hostname.length > 50;
  }

  // ── Phishing path check ───────────────────────────────────────────────────
  function hasPhishingPath(pathname) {
    return PHISHING_PATH_KEYWORDS.some(function (kw) {
      return pathname.indexOf(kw) !== -1;
    });
  }

  // ── Data URI check ────────────────────────────────────────────────────────
  function isDataUri(url) {
    return (url || '').toLowerCase().indexOf('data:') === 0;
  }

  // ── analyzeUrl ─────────────────────────────────────────────────────────────

  function analyzeUrl(url) {
    var reasons = [];
    var score = 0;
    var risk = 'safe';

    if (!url || typeof url !== 'string' || url.trim() === '') {
      return { url: url, risk: 'safe', score: 0, reasons: ['Empty or invalid URL'] };
    }

    // Data URI — dangerous
    if (isDataUri(url)) {
      return {
        url: url,
        risk: 'dangerous',
        score: 100,
        reasons: ['Data URI detected — can execute arbitrary code in browser context']
      };
    }

    var hostname = getHostname(url);
    var protocol = getProtocol(url);
    var pathname = getPathname(url);

    // Safe domain — early return if no other issues
    if (hostname && isSafeDomain(hostname)) {
      return { url: url, risk: 'safe', score: 0, reasons: ['Domain is in the trusted whitelist'] };
    }

    // Raw IP address as host — dangerous
    if (hostname && isRawIp(hostname)) {
      score += 60;
      reasons.push('Raw IP address used as hostname — legitimate services use domain names');
    }

    // Brand in subdomain but wrong root domain — dangerous
    var spoofedBrand = hostname ? isBrandSubdomainSpoof(hostname) : null;
    if (spoofedBrand) {
      score += 50;
      reasons.push('Brand name "' + spoofedBrand + '" appears in a non-official domain — possible impersonation');
    }

    // URL shortener — suspicious
    if (hostname && isShortener(hostname)) {
      score += 30;
      reasons.push('URL shortener detected — destination is hidden');
    }

    // Suspicious TLD — suspicious
    if (hostname && hasSuspiciousTld(hostname)) {
      score += 25;
      reasons.push('Suspicious top-level domain: ' + hostname.split('.').slice(-1)[0]);
    }

    // Excessive hyphens — suspicious
    if (hostname && hasExcessiveHyphens(hostname)) {
      score += 15;
      reasons.push('Hostname contains 3 or more hyphens — common in phishing URLs');
    }

    // Very long hostname — suspicious
    if (hostname && hasLongHostname(hostname)) {
      score += 10;
      reasons.push('Very long hostname (' + hostname.length + ' chars) — suspicious pattern');
    }

    // Phishing path keywords — suspicious
    if (pathname && hasPhishingPath(pathname)) {
      score += 20;
      reasons.push('URL path contains phishing-related keyword (e.g., /login, /kyc, /otp)');
    }

    // HTTP (not HTTPS) — informational
    if (protocol === 'http:') {
      score += 5;
      reasons.push('Unencrypted HTTP connection — data may be intercepted');
    }

    // Clamp score
    score = Math.min(score, 100);
    score = Math.max(score, 0);

    if (score >= 60) risk = 'dangerous';
    else if (score >= 25) risk = 'suspicious';
    else risk = 'safe';

    if (reasons.length === 0) {
      reasons.push('No significant indicators found');
    }

    return {
      url: url,
      risk: risk,
      score: score,
      reasons: reasons
    };
  }

  // ── analyzeAll ─────────────────────────────────────────────────────────────

  function analyzeAll(urls) {
    if (!urls || !urls.length) return [];
    return urls.map(function (url) {
      return analyzeUrl(url);
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    analyzeUrl: analyzeUrl,
    analyzeAll: analyzeAll
  };

})();
