# KAVACH

<div align="center">
  <img src="frontend/src/assets/hero.png" alt="KAVACH hero artwork" width="260" />

  <h3>Digital Armor for Every Indian</h3>
  <p>
    A multi-modal cyber fraud defense platform built for <b>HackBaroda 2026</b>.
    KAVACH detects <b>deepfake voice scams</b>, <b>SIM swap attacks</b>, and <b>fake job offers</b>
    through one unified command center.
  </p>

  <p>
    <img src="https://img.shields.io/badge/HackBaroda-2026-00c878?style=for-the-badge" alt="HackBaroda 2026" />
    <img src="https://img.shields.io/badge/Frontend-React_19-61dafb?style=for-the-badge&logo=react&logoColor=06121c" alt="React 19" />
    <img src="https://img.shields.io/badge/Backend-Express-111111?style=for-the-badge&logo=express" alt="Express" />
    <img src="https://img.shields.io/badge/Audio_Service-FastAPI-0ea5a3?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Status-Demo_Ready-f97316?style=for-the-badge" alt="Demo Ready" />
  </p>
</div>

---

## Why KAVACH Hits Hard

Most scam defense tools fight one attack at a time.
KAVACH is built around the idea that modern fraud is a chain:

1. A fake job offer earns trust.
2. A deepfake voice call adds urgency.
3. A SIM swap steals OTPs and drains accounts.

KAVACH blocks that chain at every stage.

## The 3 Shields

| Module | What it stops | How it works |
| --- | --- | --- |
| `Voice Shield` | AI-generated voice scams and cloned-call impersonation | Audio upload or live mic recording is analyzed with DSP features like MFCC anomaly, spectral flux, pitch variance, energy consistency, and voice-print heuristics. |
| `SIM Guard` | SIM swap fraud, OTP hijack, and device takeover signals | A live Socket.IO simulation streams telecom-style threat events, escalates risk in real time, and triggers an automatic freeze flow at critical severity. |
| `Job Shield` | Fraudulent job offers, phishing PDFs, and pressure tactics | Text or PDF content is scanned for scam patterns, red flags are extracted, and detected companies are checked against MCA-style verification logic. |

## What Makes The Demo Cool

- Real-time command center UI with animated threat cards and scan history
- Voice deepfake analysis with feature bars, verdicts, and AI explanations
- SIM swap attack simulation that ramps from normal activity to full incident
- Fake job scanner with risk scoring, phrase-level red flags, and company checks
- Graceful fallback behavior when external AI services are unavailable

## Built With

- React
- Node.js
- Python
- Real-time event streaming
- AI-assisted fraud analysis

## Quick Start

### Launch The Project

```bash
./start-all.sh
```

Best run from `Git Bash` or `WSL` on Windows, since the launcher is a Bash script.

Install the required dependencies for the project before launch, then run the command above to start the experience.

## Demo Flow

If you want the full "judge demo" experience, use this order:

### 1. Job Shield

- Open the fake job scanner
- Paste the sample scam message from the UI
- Watch red flags, scam score, and company verification appear

### 2. Voice Shield

- Open the deepfake detector
- Upload `frontend/public/realistic_ai_scam.mp3`
- Review the confidence score, audio indicators, and AI explanation

### 3. SIM Guard

- Open the SIM swap module
- Register a number and trigger the demo attack
- Watch the timeline escalate from low-risk activity to transaction freeze

## Design Vibe

The product is intentionally built like a cyber defense dashboard instead of a generic CRUD app:

- glowing module cards
- animated telemetry
- threat-score visualizations
- scan-history command center
- high-contrast "mission control" presentation

That makes it demo-friendly without losing technical substance.

## Why This Matters

India's fraud landscape is no longer about a single phishing SMS.
Scammers now mix social engineering, cloned voices, fake hiring, and telecom compromise into one coordinated playbook.

KAVACH answers that with one platform, three shields, and a clear story:

> trust is attacked in layers, so defense must be layered too.

## Built For

- hackathon demo storytelling
- cyber-fraud awareness
- prototype validation
- future expansion into real-world fraud intel systems

---

<div align="center">
  <b>KAVACH</b><br/>
  One platform. Three shields. Zero mercy for scammers.
</div>
