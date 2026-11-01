// @ts-nocheck
/**
 * ScamSathi MailGuard AI — Page Logic
 * Handles form input, preset filling, analysis calls, and result rendering.
 * Runs 100% in-browser. Zero network requests. No data leaves the page.
 */

(function () {
  "use strict";

  // ── Preset email data ─────────────────────────────────────────────────────
  var PRESETS = {
    kyc: {
      subject:     "URGENT: Your SBI Account KYC Verification Required — Account will be BLOCKED",
      senderName:  "SBI Bank Security Team",
      senderEmail: "noreply-sbi@sbi-kyc-alert.xyz",
      body: [
        "Dear Valued Customer,",
        "",
        "We have detected that your SBI Internet Banking KYC is INCOMPLETE.",
        "As per RBI mandate, your account will be SUSPENDED within 24 hours if you do not verify immediately.",
        "",
        "ACTION REQUIRED NOW:",
        "1. Click the link below to update your KYC",
        "2. Enter your account number, ATM PIN and Aadhaar number",
        "3. Submit documents for verification",
        "",
        "VERIFY NOW: https://sbi-kyc-update.top/secure/verify",
        "",
        "Failure to comply will result in permanent account closure.",
        "",
        "Regards,",
        "SBI Customer Support Team"
      ].join("\n"),
      links: "https://sbi-kyc-update.top/secure/verify"
    },
    lottery: {
      subject:     "🎉 CONGRATULATIONS! You Have Won ₹85 Lakh — Claim Your Prize NOW",
      senderName:  "National Prize Foundation India",
      senderEmail: "prizes@national-lottery-india.gdn",
      body: [
        "CONGRATULATIONS!",
        "",
        "Your email address has been selected as the LUCKY WINNER in the National Digital Lottery 2024.",
        "Prize Amount: ₹85,00,000 (Eighty Five Lakh Rupees)",
        "",
        "To CLAIM your prize, you must:",
        "1. Pay a one-time refundable processing fee of ₹4,999",
        "2. Submit your Aadhaar, PAN and bank details to release the prize",
        "",
        "Claim before: 48 HOURS — or prize will be forfeited!",
        "CLAIM NOW: https://india-prize-winner.tk/claim/85lakh",
        "",
        "Lucky Winner Coordinator,",
        "National Prize Foundation"
      ].join("\n"),
      links: "https://india-prize-winner.tk/claim/85lakh"
    },
    job: {
      subject:     "URGENT HIRING: Work From Home — Earn ₹50,000/Month, No Experience Required",
      senderName:  "HR Team — Global Opportunities",
      senderEmail: "hr-team@workfromhome-india.xyz",
      body: [
        "Dear Applicant,",
        "",
        "We are urgently hiring for WORK FROM HOME data entry positions.",
        "Earn ₹1,500 to ₹2,500 per day — GUARANTEED INCOME!",
        "",
        "Requirements:",
        "- No experience required",
        "- No qualification needed",
        "- Just 2-3 hours per day",
        "- Unlimited income potential",
        "",
        "Apply NOW and start earning TODAY!",
        "Registration fee: ₹999 (fully refundable)",
        "Apply: https://workfromhome-earn-daily.win/apply",
        "",
        "Be your own boss. Join 50,000+ successful earners!",
        "",
        "HR Department"
      ].join("\n"),
      links: "https://workfromhome-earn-daily.win/apply"
    },
    phishing: {
      subject:     "Security Alert: Unusual sign-in to your Google Account — Verify Immediately",
      senderName:  "Google Security",
      senderEmail: "security-alert@google-accounts-verify.click",
      body: [
        "Hi there,",
        "",
        "We detected an unusual sign-in attempt to your Google account.",
        "",
        "Location: Mumbai, India",
        "Device: Unknown Android Device",
        "Time: Today, 3:42 AM",
        "",
        "If this was not you, your account may be COMPROMISED.",
        "",
        "Click here to verify your account and reset your password IMMEDIATELY:",
        "https://google-accounts-verify.click/secure/signin",
        "",
        "If you do not verify within 2 hours, your account will be LOCKED.",
        "",
        "Google Security Team"
      ].join("\n"),
      links: "https://google-accounts-verify.click/secure/signin"
    },
    safe: {
      subject:     "Meeting notes from yesterday's standup",
      senderName:  "Priya Sharma",
      senderEmail: "priya.sharma@yourcompany.com",
      body: [
        "Hi team,",
        "",
        "Please find attached the notes from yesterday's standup meeting.",
        "Key action items:",
        "- Ravi to complete the API documentation by Friday",
        "- Anita to schedule user testing for next week",
        "- Team retrospective moved to 3 PM on Thursday",
        "",
        "Let me know if I missed anything.",
        "",
        "Thanks,",
        "Priya"
      ].join("\n"),
      links: ""
    }
  };

  // ── DOM refs ──────────────────────────────────────────────────────────────
  var form         = document.getElementById("emailForm");
  var subjectEl    = document.getElementById("emailSubject");
  var senderNameEl = document.getElementById("senderName");
  var senderEmailEl= document.getElementById("senderEmail");
  var bodyEl       = document.getElementById("emailBody");
  var linksEl      = document.getElementById("emailLinks");
  var charCount    = document.getElementById("bodyCharCount");
  var analyzeBtn   = document.getElementById("analyzeBtn");
  var clearBtn     = document.getElementById("clearBtn");
  var emptyState   = document.getElementById("emptyState");
  var loadingState = document.getElementById("loadingState");
  var resultsState = document.getElementById("resultsState");

  // ── Char counter ──────────────────────────────────────────────────────────
  bodyEl.addEventListener("input", function () {
    charCount.textContent = bodyEl.value.length + " characters";
  });

  // ── Presets ───────────────────────────────────────────────────────────────
  document.querySelectorAll(".mg-chip[data-preset]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var p = PRESETS[btn.dataset.preset];
      if (!p) return;
      subjectEl.value    = p.subject;
      senderNameEl.value = p.senderName;
      senderEmailEl.value= p.senderEmail;
      bodyEl.value       = p.body;
      linksEl.value      = p.links;
      charCount.textContent = bodyEl.value.length + " characters";
      subjectEl.focus();
    });
  });

  // ── Clear ─────────────────────────────────────────────────────────────────
  clearBtn.addEventListener("click", function () {
    form.reset();
    charCount.textContent = "0 characters";
    showState("empty");
  });

  // ── State management ──────────────────────────────────────────────────────
  function showState(state) {
    emptyState.classList.add("hidden");
    loadingState.classList.add("hidden");
    resultsState.classList.add("hidden");
    if (state === "empty")   emptyState.classList.remove("hidden");
    if (state === "loading") loadingState.classList.remove("hidden");
    if (state === "results") resultsState.classList.remove("hidden");
  }

  // ── Risk theme helpers ────────────────────────────────────────────────────
  function riskTheme(risk) {
    var map = {
      low:        { cls: "risk-low",  bg: "bg-low",  color: "#10b981", icon: "✅", label: "LOW RISK",  stroke: "#10b981" },
      suspicious: { cls: "risk-sus",  bg: "bg-sus",  color: "#f59e0b", icon: "⚠️", label: "SUSPICIOUS", stroke: "#f59e0b" },
      high:       { cls: "risk-high", bg: "bg-high", color: "#ef4444", icon: "🚨", label: "HIGH RISK", stroke: "#ef4444" },
      critical:   { cls: "risk-crit", bg: "bg-crit", color: "#7c3aed", icon: "🚨", label: "CRITICAL",  stroke: "#7c3aed" }
    };
    return map[risk] || map.suspicious;
  }

  function escHTML(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }

  // ── Score ring ────────────────────────────────────────────────────────────
  function buildScoreRing(score, theme) {
    var CIRC = 220;
    var offset = CIRC - Math.round((score / 100) * CIRC);
    return [
      '<div class="mg-score-ring">',
        '<svg viewBox="0 0 90 90" aria-hidden="true">',
          '<circle class="mg-score-ring__bg" cx="45" cy="45" r="35"/>',
          '<circle class="mg-score-ring__fill" cx="45" cy="45" r="35"',
            ' stroke="' + theme.stroke + '"',
            ' style="stroke-dashoffset:' + offset + '"',
          '/>',
        '</svg>',
        '<div class="mg-score-ring__num ' + theme.cls + '">',
          score,
          '<span class="mg-score-ring__label">/100</span>',
        '</div>',
      '</div>'
    ].join("");
  }

  // ── Render results ────────────────────────────────────────────────────────
  function renderResults(analysis, emailData) {
    var t = riskTheme(analysis.risk);
    var sa = analysis.senderAnalysis || {};
    var sigs = analysis.signals || [];
    var urls = analysis.urlFindings || [];
    var acts = analysis.actions || [];

    // Score section
    var html = '<div class="mg-score-section">';
    html += buildScoreRing(analysis.score, t);
    html += '<div class="mg-score-meta">';
    html += '<span class="mg-risk-badge ' + t.cls + ' ' + t.bg + '">' + t.icon + ' ' + t.label + '</span>';
    html += '<div class="mg-score-category">' + escHTML(analysis.category) + '</div>';
    html += '<div class="mg-score-explanation">' + escHTML(analysis.explanation) + '</div>';
    html += '</div></div>';

    // Sender analysis
    html += '<div class="mg-section-title">Sender Analysis</div>';
    html += '<div class="mg-sender-card">';
    html += '<span class="mg-sender-icon">' + (sa.trusted ? "✅" : "⚠️") + '</span>';
    html += '<div class="mg-sender-info">';
    html += '<div class="mg-sender-name">' + escHTML(emailData.senderName || "Unknown") + '</div>';
    html += '<div class="mg-sender-email">' + escHTML(emailData.senderEmail || "No address provided") + '</div>';
    html += '</div>';
    var domainBadge = sa.trusted
      ? '<span class="mg-sender-domain-badge risk-low bg-low">Trusted Domain</span>'
      : '<span class="mg-sender-domain-badge risk-high bg-high">Unverified Domain</span>';
    html += domainBadge + '</div>';
    html += '<p style="font-size:0.78rem;color:var(--text-muted);margin-top:0.5rem;">' + escHTML(sa.reason || "") + '</p>';

    // Detected signals
    if (sigs.length > 0) {
      html += '<div class="mg-section-title">Detected Threat Signals (' + sigs.length + ')</div>';
      html += '<ul class="mg-signals-list">';
      sigs.forEach(function (s) {
        html += '<li class="mg-signal-item">';
        html += '<span class="mg-signal-dot" style="background:' + t.color + '"></span>';
        html += '<div><div class="mg-signal-name">' + escHTML(s.name) + '</div>';
        html += '<div class="mg-signal-desc">' + escHTML(s.description) + '</div></div>';
        html += '</li>';
      });
      html += '</ul>';
    }

    // URL findings
    if (urls.length > 0) {
      html += '<div class="mg-section-title">Link Analysis (' + urls.length + ' suspicious)</div>';
      html += '<ul class="mg-url-list">';
      urls.forEach(function (u) {
        var urlRisk = u.risk === "dangerous" ? "risk-high" : "risk-sus";
        html += '<li class="mg-url-item ' + (u.risk === "dangerous" ? "bg-high" : "bg-sus") + '">';
        html += '<span class="mg-url-href">' + escHTML(u.url) + '</span>';
        html += '<span class="mg-url-risk ' + urlRisk + '">' + u.risk.toUpperCase() + ' · ' + u.score + '/100</span>';
        if (u.reasons && u.reasons.length) {
          html += '<div class="mg-url-reasons">⚠ ' + u.reasons.map(escHTML).join(' · ') + '</div>';
        }
        html += '</li>';
      });
      html += '</ul>';
    } else if (emailData.links.length > 0) {
      html += '<div class="mg-section-title">Links</div>';
      html += '<p style="font-size:0.82rem;color:var(--text-muted);">✅ ' + emailData.links.length + ' link(s) checked — no suspicious patterns detected.</p>';
    }

    // Recommended actions
    if (acts.length > 0) {
      html += '<div class="mg-section-title">Recommended Actions</div>';
      html += '<ul class="mg-actions-list">';
      acts.forEach(function (a) {
        html += '<li class="mg-action-item"><span class="mg-action-bullet">→</span><span>' + escHTML(a) + '</span></li>';
      });
      html += '</ul>';
    }

    resultsState.innerHTML = html;
    showState("results");
  }

  // ── Form submit ───────────────────────────────────────────────────────────
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var emailData = {
      subject:     subjectEl.value.trim(),
      senderName:  senderNameEl.value.trim(),
      senderEmail: senderEmailEl.value.trim(),
      body:        bodyEl.value.trim(),
      links:       linksEl.value.trim()
        ? linksEl.value.trim().split(/\s*\n\s*/).filter(function (l) { return l.length > 5; })
        : []
    };

    if (!emailData.subject && !emailData.body) {
      bodyEl.focus();
      return;
    }

    showState("loading");
    analyzeBtn.disabled = true;

    // Slight delay to show loading spinner (engine is synchronous)
    setTimeout(function () {
      try {
        var analyzer = window.MailGuardAnalyzer;
        if (!analyzer) {
          resultsState.innerHTML = '<p style="color:#ef4444;padding:1rem;">⚠ Detection engine not loaded. Make sure email-analyzer.js is included.</p>';
          showState("results");
          return;
        }
        var analysis = analyzer.analyze(emailData);
        renderResults(analysis, emailData);
      } catch (err) {
        resultsState.innerHTML = '<p style="color:#ef4444;padding:1rem;">Error during analysis: ' + escHTML(err.message) + '</p>';
        showState("results");
      } finally {
        analyzeBtn.disabled = false;
      }
    }, 200);
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  showState("empty");

})();

