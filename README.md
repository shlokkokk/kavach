<div align="center">
  <img src="frontend/src/assets/hero.png" alt="KAVACH hero artwork" width="260" />

  <h1>🛡️ KAVACH</h1>
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

## 🎯 The Vision

Most scam defense tools fight one attack at a time. KAVACH is built around the idea that modern fraud is a chain:
1. A **fake job offer** earns trust.
2. A **deepfake voice call** adds urgency.
3. A **SIM swap** steals OTPs and drains accounts.

KAVACH blocks that chain at every stage with an interconnected, highly-visual defense platform.

---

## ⚔️ The 3 Shields (Core Modules)

### 🎙️ 1. Voice Shield (Deepfake Detection)
Analyzes live microphone input or uploaded audio files against 9 scientific features (MFCC anomaly, spectral flux, zero crossing rate, etc.).
* **Neural Synapse Visualizer**: Real-time canvas visualization of audio data.
* **Instant Intel**: Provides an AI-powered explanation of the threat, alongside forensic heuristics.
* **Demo Ready**: Includes built-in AI vs Human audio sample loaders for instant testing.

### 📱 2. SIM Guard (Telecom Identity Monitor)
Simulates and protects against SIM swap fraud, OTP hijacking, and device takeover.
* **Carrier Node Intelligence**: Live integration with IPQualityScore for provider lookup and carrier confidence.
* **Socket Telemetry**: Live stream of network integrity scans and WebSocket events.
* **Simulation Lab**: Allows the user to trigger specific attacks (Location Jump, OTP Flood) and auto-attack sequences to test the system's freeze protocols.

### 📄 3. Job Shield (Fraud Forensics)
Scans text messages and PDF documents for fraudulent job offers and phishing URLs.
* **ZeroRisk Sentinel Integration**: In-depth URL link analysis checking for typosquatting and malicious domains.
* **NVIDIA NIM API**: LLaMA 3.1 70B powers the scam scoring, highlighting exact red flags in the text.
* **MCA Verification**: Live company verification against government data logic.

---

## ⚙️ Tech Stack

- **Frontend**: React 19, Vite, Framer Motion, Zustand (State Management)
- **Backend (Node)**: Express.js, Socket.io, Multer
- **Microservices (Python)**: `librosa` for audio forensics, heuristic URL threat analysis
- **External APIs**: NVIDIA NIM (LLM), MCA21, IPQS (Carrier Data)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- API Keys for NVIDIA NIM and IPQS in `backend/.env`

### Installation & Launch
The easiest way to launch the entire platform (Frontend, Backend, Python Audio Service) is via our unified bash script:

```bash
# Clone the repo and navigate to the directory
cd hackbaroda-2026

# Launch all microservices
./start-all.sh
```
*(Best run from Git Bash, WSL, or macOS/Linux terminals)*

---

## 🎭 Running the Demo

For the ultimate "God-Level" judge experience, follow this order:

1. **Job Shield**: Upload `demo_job_offer.pdf` or paste a WhatsApp scam message. Watch the Link Analyzer and NVIDIA NIM rip it apart and verify the company.
2. **Voice Shield**: Open the module and hit "Load Sample AI". Watch the Neural Synapse Visualizer plot the deepfake anomalies while the heuristics gauge screams red.
3. **SIM Guard**: Register a number. Open the **Simulation Lab** and run the "Auto Attack Sequence". Watch the live socket telemetry ramp from normal activity to a frozen bank account.

---

<div align="center">
  <b>KAVACH</b><br/>
  <i>One platform. Three shields. Zero mercy for scammers.</i>
</div>
