# ScamSathi AI — Native Android Architecture & Security Specification

This document details the mobile application architecture, supported Android APIs, privacy design, and technical boundaries for ScamSathi AI on Android.

---

## 1. Supported Capabilities & Architecture

| Module | Mechanism | Android API Level | Privacy / Permission Model |
|---|---|---|---|
| **PWA Web App Shell** | Chrome / TWA / WebView | Android 7.0+ (API 24+) | Minimal sandbox. No special permissions required. |
| **Share-to-ScamSathi** | `Intent.ACTION_SEND` (text/plain) | All Android versions | **User-Initiated.** User explicitly selects ScamSathi from the Android Share Sheet. |
| **Real-Time Notification Shield** | `NotificationListenerService` | Android 8.0+ (API 26+) | **Explicit Consent Required.** System settings toggle under Special App Access. Runs 100% locally on-device. |
| **National 1930 Helpline** | `Intent.ACTION_DIAL` (tel:1930) | All Android versions | Opens system dialer with pre-filled toll-free emergency number. |

---

## 2. Platform Limitations & Ethical Security Boundaries

> [!IMPORTANT]
> **Android Sandbox Isolation vs. Unrealistic Claims**
> - Android assigns each application an isolated Linux UID sandbox.
> - **No browser extension or standard application can silently monitor private chats inside the native WhatsApp or Gmail apps** without root exploitation or illicit accessibility service abuse.
> - ScamSathi does **NOT** use accessibility abuse or background keylogging.
> - ScamSathi uses the **official Android Share Target architecture**: when a user receives a suspicious message in WhatsApp, SMS, or Gmail, they tap **Share &rarr; ScamSathi AI**, where on-device heuristics evaluate the text safely and immediately.

---

## 3. Google Play Compliance
- **Zero Raw Data Exfiltration:** Neither messages, OTPs, nor contact information are sent over external networks.
- **Minimal Permissions:** Only standard network access (`INTERNET`) for PWA updates and `POST_NOTIFICATIONS` (Android 13+) for threat advisories.
- **Air-Gapped Heuristics:** Evaluation logic executes within the local JavaScript V8 / WebView runtime.

