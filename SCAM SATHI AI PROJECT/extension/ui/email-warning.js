// @ts-nocheck
/**
 * ScamSathi MailGuard AI - Email Warning Banner Builder
 * Builds and returns the inline risk banner DOM element.
 * Exports: window.MailGuardWarning
 * Pattern: IIFE, no ES modules.
 */

window.MailGuardWarning = (function () {

  // ── escapeHTML ─────────────────────────────────────────────────────────────
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Risk palette ───────────────────────────────────────────────────────────
  var RISK_CONFIG = {
    low: {
      border: '#10b981',
      badgeBg: '#ecfdf5',
      badgeText: '#065f46',
      emoji: '✅',
      label: 'Low Risk'
    },
    suspicious: {
      border: '#f59e0b',
      badgeBg: '#fffbeb',
      badgeText: '#92400e',
      emoji: '⚠️',
      label: 'Suspicious'
    },
    high: {
      border: '#ef4444',
      badgeBg: '#fef2f2',
      badgeText: '#991b1b',
      emoji: '🚨',
      label: 'High Risk'
    },
    critical: {
      border: '#7c3aed',
      badgeBg: '#f5f3ff',
      badgeText: '#4c1d95',
      emoji: '🛑',
      label: 'CRITICAL THREAT'
    }
  };

  // ── Inject global CSS once ─────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('mg-styles')) return;
    var style = document.createElement('style');
    style.id = 'mg-styles';
    style.textContent = [
      /* Banner container */
      '.mg-banner {',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
      '  background: #ffffff;',
      '  border-radius: 8px;',
      '  border-left: 4px solid #94a3b8;',
      '  box-shadow: 0 2px 12px rgba(0,0,0,0.10);',
      '  margin: 10px 0 14px 0;',
      '  padding: 0;',
      '  overflow: hidden;',
      '  animation: mgSlideDown 0.28s cubic-bezier(0.22,1,0.36,1);',
      '  position: relative;',
      '  z-index: 9999;',
      '  max-width: 100%;',
      '}',

      /* Risk-specific left borders */
      '.mg-banner--low     { border-left-color: #10b981; }',
      '.mg-banner--suspicious { border-left-color: #f59e0b; }',
      '.mg-banner--high    { border-left-color: #ef4444; }',
      '.mg-banner--critical { border-left-color: #7c3aed; }',

      /* Header row */
      '.mg-banner__header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding: 10px 14px 8px 14px;',
      '  background: #f8fafc;',
      '  border-bottom: 1px solid #e2e8f0;',
      '}',

      '.mg-banner__icon-title {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '}',

      '.mg-banner__icon {',
      '  font-size: 20px;',
      '  line-height: 1;',
      '}',

      '.mg-banner__title {',
      '  font-size: 13px;',
      '  font-weight: 700;',
      '  color: #0f172a;',
      '  line-height: 1.2;',
      '}',

      '.mg-banner__category {',
      '  font-size: 11px;',
      '  color: #64748b;',
      '  margin-top: 1px;',
      '}',

      '.mg-banner__score-wrap {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '}',

      '.mg-banner__score {',
      '  font-size: 12px;',
      '  font-weight: 700;',
      '  padding: 2px 8px;',
      '  border-radius: 12px;',
      '  background: #f1f5f9;',
      '  color: #334155;',
      '  font-variant-numeric: tabular-nums;',
      '}',

      '.mg-banner__dismiss {',
      '  background: transparent;',
      '  border: none;',
      '  cursor: pointer;',
      '  color: #94a3b8;',
      '  font-size: 13px;',
      '  padding: 2px 5px;',
      '  border-radius: 4px;',
      '  line-height: 1;',
      '  transition: color 0.15s, background 0.15s;',
      '}',

      '.mg-banner__dismiss:hover {',
      '  color: #475569;',
      '  background: #e2e8f0;',
      '}',

      /* Body section */
      '.mg-banner__body {',
      '  padding: 10px 14px 12px 14px;',
      '}',

      '.mg-banner__explanation {',
      '  font-size: 12.5px;',
      '  color: #334155;',
      '  line-height: 1.5;',
      '  margin: 0 0 8px 0;',
      '}',

      /* Signals */
      '.mg-banner__signals {',
      '  margin: 6px 0;',
      '}',

      '.mg-banner__signals-toggle {',
      '  font-size: 11px;',
      '  color: #6366f1;',
      '  cursor: pointer;',
      '  background: none;',
      '  border: none;',
      '  padding: 2px 0;',
      '  font-weight: 600;',
      '  text-decoration: underline;',
      '  text-underline-offset: 2px;',
      '}',

      '.mg-banner__signals-list {',
      '  list-style: none;',
      '  margin: 6px 0 0 0;',
      '  padding: 8px 10px;',
      '  background: #f8fafc;',
      '  border: 1px solid #e2e8f0;',
      '  border-radius: 6px;',
      '  display: none;',
      '}',

      '.mg-banner__signals-list.mg-open {',
      '  display: block;',
      '}',

      '.mg-banner__signal-item {',
      '  font-size: 11.5px;',
      '  color: #475569;',
      '  padding: 3px 0;',
      '  display: flex;',
      '  align-items: flex-start;',
      '  gap: 6px;',
      '  border-bottom: 1px solid #f1f5f9;',
      '}',

      '.mg-banner__signal-item:last-child { border-bottom: none; }',

      '.mg-banner__signal-dot {',
      '  width: 8px;',
      '  height: 8px;',
      '  border-radius: 50%;',
      '  background: #ef4444;',
      '  flex-shrink: 0;',
      '  margin-top: 3px;',
      '}',

      '.mg-banner__signal-dot--ok { background: #10b981; }',

      /* Actions */
      '.mg-banner__actions {',
      '  margin-top: 8px;',
      '  padding-top: 8px;',
      '  border-top: 1px dashed #e2e8f0;',
      '}',

      '.mg-banner__action-label {',
      '  font-size: 11px;',
      '  font-weight: 700;',
      '  color: #475569;',
      '  text-transform: uppercase;',
      '  letter-spacing: 0.05em;',
      '  margin-bottom: 4px;',
      '}',

      '.mg-banner__action-item {',
      '  font-size: 12px;',
      '  color: #334155;',
      '  padding: 2px 0;',
      '  display: flex;',
      '  align-items: flex-start;',
      '  gap: 5px;',
      '}',

      /* Slide-down animation */
      '@keyframes mgSlideDown {',
      '  from { opacity: 0; transform: translateY(-8px); }',
      '  to   { opacity: 1; transform: translateY(0); }',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  // ── Build banner DOM ───────────────────────────────────────────────────────

  function buildBanner(analysis) {
    injectStyles();

    var risk = analysis.risk || 'low';
    var cfg = RISK_CONFIG[risk] || RISK_CONFIG.low;

    var banner = document.createElement('div');
    banner.className = 'mg-banner mg-banner--' + risk;
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-label', 'MailGuard security analysis result');

    // ── Header ───────────────────────────────────────────────────────────────
    var header = document.createElement('div');
    header.className = 'mg-banner__header';

    // Icon + title group
    var iconTitle = document.createElement('div');
    iconTitle.className = 'mg-banner__icon-title';

    var iconSpan = document.createElement('span');
    iconSpan.className = 'mg-banner__icon';
    iconSpan.textContent = cfg.emoji;

    var titleWrap = document.createElement('div');

    var titleEl = document.createElement('div');
    titleEl.className = 'mg-banner__title';
    titleEl.textContent = 'MailGuard: ' + cfg.label;

    var catEl = document.createElement('div');
    catEl.className = 'mg-banner__category';
    catEl.textContent = escapeHTML(analysis.category || 'Email Analysis');

    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(catEl);

    iconTitle.appendChild(iconSpan);
    iconTitle.appendChild(titleWrap);

    // Score + dismiss
    var scoreWrap = document.createElement('div');
    scoreWrap.className = 'mg-banner__score-wrap';

    var scoreEl = document.createElement('span');
    scoreEl.className = 'mg-banner__score';
    scoreEl.style.background = cfg.badgeBg;
    scoreEl.style.color = cfg.badgeText;
    scoreEl.textContent = (analysis.score || 0) + '/100';

    var dismissBtn = document.createElement('button');
    dismissBtn.className = 'mg-banner__dismiss';
    dismissBtn.type = 'button';
    dismissBtn.title = 'Dismiss';
    dismissBtn.textContent = '✕';
    dismissBtn.addEventListener('click', function () {
      banner.style.animation = 'none';
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-6px)';
      banner.style.transition = 'opacity 0.18s, transform 0.18s';
      setTimeout(function () { banner.remove(); }, 200);
    });

    scoreWrap.appendChild(scoreEl);
    scoreWrap.appendChild(dismissBtn);

    header.appendChild(iconTitle);
    header.appendChild(scoreWrap);

    // ── Body ──────────────────────────────────────────────────────────────────
    var body = document.createElement('div');
    body.className = 'mg-banner__body';

    // Explanation
    var explEl = document.createElement('p');
    explEl.className = 'mg-banner__explanation';
    explEl.textContent = analysis.explanation || '';
    body.appendChild(explEl);

    // Signals section (collapsible)
    var matchedSignals = (analysis.signals || []).filter(function (s) { return s.matched; });
    if (matchedSignals.length > 0) {
      var signalsWrap = document.createElement('div');
      signalsWrap.className = 'mg-banner__signals';

      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'mg-banner__signals-toggle';
      toggleBtn.type = 'button';
      toggleBtn.textContent = '▶ Show ' + matchedSignals.length + ' threat signal' + (matchedSignals.length > 1 ? 's' : '');

      var sigList = document.createElement('ul');
      sigList.className = 'mg-banner__signals-list';

      matchedSignals.forEach(function (sig) {
        var li = document.createElement('li');
        li.className = 'mg-banner__signal-item';

        var dot = document.createElement('span');
        dot.className = 'mg-banner__signal-dot';

        var text = document.createElement('span');
        text.textContent = sig.name + ': ' + (sig.description || '') + ' (+' + sig.weight + ' pts)';

        li.appendChild(dot);
        li.appendChild(text);
        sigList.appendChild(li);
      });

      toggleBtn.addEventListener('click', function () {
        var open = sigList.classList.toggle('mg-open');
        toggleBtn.textContent = (open ? '▼ Hide ' : '▶ Show ') + matchedSignals.length + ' threat signal' + (matchedSignals.length > 1 ? 's' : '');
      });

      signalsWrap.appendChild(toggleBtn);
      signalsWrap.appendChild(sigList);
      body.appendChild(signalsWrap);
    }

    // Actions
    var actions = analysis.actions || [];
    if (actions.length > 0) {
      var actionsWrap = document.createElement('div');
      actionsWrap.className = 'mg-banner__actions';

      var actLabel = document.createElement('div');
      actLabel.className = 'mg-banner__action-label';
      actLabel.textContent = '🛡 Recommended Actions';
      actionsWrap.appendChild(actLabel);

      actions.forEach(function (action) {
        var item = document.createElement('div');
        item.className = 'mg-banner__action-item';

        var bullet = document.createElement('span');
        bullet.textContent = '→';
        bullet.style.flexShrink = '0';
        bullet.style.color = cfg.border;
        bullet.style.fontWeight = '700';

        var txt = document.createElement('span');
        txt.textContent = action;

        item.appendChild(bullet);
        item.appendChild(txt);
        actionsWrap.appendChild(item);
      });

      body.appendChild(actionsWrap);
    }

    // Assemble
    banner.appendChild(header);
    banner.appendChild(body);

    return banner;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    buildBanner: buildBanner,
    injectStyles: injectStyles
  };

})();
