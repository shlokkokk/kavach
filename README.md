

<div align="center">

<br/>

# 🛡️ KAVACH
### *Digital Armor for Every Indian*

<p>
  A multi-modal cyber fraud defense platform.<br/>
  Three real-time AI shields. One command center. Zero mercy for scammers.
</p>

<p>
  <img src="https://img.shields.io/badge/Platform-Cybersecurity-00c878?style=for-the-badge" alt="Cybersecurity" />
  <img src="https://img.shields.io/badge/Frontend-React_19-61dafb?style=for-the-badge&logo=react&logoColor=06121c" alt="React 19" />
  <img src="https://img.shields.io/badge/Backend-Express.js-111111?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Audio_Service-FastAPI-0ea5a3?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/AI-NVIDIA_NIM-76b900?style=for-the-badge&logo=nvidia&logoColor=white" alt="NVIDIA NIM" />
  <img src="https://img.shields.io/badge/AI-Groq_LLaMA_3.3-f55036?style=for-the-badge" alt="Groq LLaMA" />
  <img src="https://img.shields.io/badge/Status-Demo_Ready-f97316?style=for-the-badge" alt="Demo Ready" />
</p>

</div>

---

## 🎬 Demo

https://github.com/user-attachments/assets/738bb55b-e815-47ec-b110-35670f9e72b4

---

## 🎯 The Problem

Modern fraud doesn't happen in isolation. It's a **coordinated attack chain**:

```
① Fake Job Offer  →  ② Deepfake Voice Call  →  ③ SIM Swap  →  ④ Account Drained
   (Gains Trust)         (Creates Urgency)        (Steals OTP)    (Game Over)
```

Existing tools tackle one threat at a time. **KAVACH breaks the chain at every stage** — simultaneously, in real time.

---

## ⚔️ The Three Shields

### 🎙️ 1 · Voice Shield — Deepfake Audio Detection

> *"If you can hear it, we can expose it."*

Analyzes live microphone recordings or uploaded audio files against **9 scientific spectral features** extracted via `librosa` — the same library used in academic deepfake research.

| Feature | What It Catches |
|---|---|
| **MFCC Anomaly** | Synthetic vocal tract patterns |
| **Spectral Flux Consistency** | AI's unnaturally stable frequency change |
| **Silence Purity** | Missing organic background noise |
| **High-Freq Flatness** | Absent fricative chaos (s, f, sh sounds) |
| **Harmonic Perfection** | "Too clean" vocal harmonics |
| **Energy Flatness** | Robot-flat energy envelope |
| **Pitch Variance** | Missing natural emotional intonation |
| **Zero Crossing Rate** | Unnatural signal transitions |
| **Breathing Pattern** | Absent or synthetic breath detection |

**Key Capabilities:**
- 🌐 **Neural Synapse Visualizer** — real-time canvas animation mapping spectral anomalies to dynamic nodes and lightning arcs
- 🎙️ **Live Mic Recording** — capture and re-record directly in the browser with no external tools
- 📂 **One-click Sample Loader** — built-in AI vs. Human audio demo files for instant testing
- 🤖 **AI Forensics Report** — Dual-LLM engine (NVIDIA NIM + Groq LLaMA 3.3 70B) generates a plain-English threat explanation after every scan

---

### 📱 2 · SIM Guard — Telecom Identity Monitor

> *"Your SIM card is the skeleton key. We protect it."*

Detects and simulates SIM swap fraud, OTP hijacking, and device takeover in real time using live carrier telemetry.

**Key Capabilities:**
- 📡 **Carrier Node Intelligence** — live IPQualityScore integration for provider lookup, fraud score, and carrier confidence (no hardcoded mocks)
- ⚡ **Live Socket Telemetry** — WebSocket event stream showing network integrity scans, anomaly spikes, and defense protocol activations as they happen
- 🧪 **Simulation Lab** — trigger individual attacks (Location Jump, OTP Flood, Device Switch) or run the **Auto Attack Sequence** to watch the full fraud chain unfold and the freeze protocol engage
- 🔒 **Freeze Protocol** — automated account lock simulation that triggers on confirmed SIM swap detection

---

### 📄 3 · Job Shield — Fraud Forensics

> *"If it's too good to be true, our AI will prove it."*

Scans WhatsApp messages and PDF documents for fraudulent job offers and phishing URLs with a multi-layer forensic pipeline.

**Key Capabilities:**
- 🔗 **Kavach URL Link Analyzer** — extracted URLs are checked against **6 independent threat intelligence sources** in parallel:
  - Google Safe Browsing
  - VirusTotal (75+ scanner engines)
  - URLHaus malware database
  - AbuseIPDB reputation scoring
  - SecurityTrails domain history
  - Heuristic pattern engine
- 🤖 **Dual-AI Intelligence** — NVIDIA NIM + Groq LLaMA 3.3 70B Versatile provides deep scam probability scoring and URL threat summarization
- 🏢 **MCA Company Verification** — cross-references company names against government MCA21 database logic to expose shell companies
- 📑 **PDF Parsing** — `pdf-parse-new` extracts and analyzes full document text including embedded links

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        KAVACH Platform                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React 19 Frontend (Vite)                    │   │
│  │     Framer Motion · Zustand · Recharts · Socket.io-client│   │
│  └──────────┬────────────────┬───────────────┬──────────────┘   │
│             │                │               │                  │
│         /audio            /job           /sim/*                 │
│             │                │               │                  │
│  ┌──────────▼────────────────▼───────────────▼──────────────┐   │
│  │              Node.js / Express Backend                   │   │
│  │              Socket.io · Multer · pdf-parse-new          │   │
│  └──────────┬────────────────┬───────────────┬──────────────┘   │
│             │                │               │                  │
│     ┌───────▼──────┐  ┌──────▼──────┐  ┌────▼────────────┐      │
│     │ Python Audio │  │  NVIDIA NIM │  │   Groq LLaMA    │      │
│     │ Service      │  │  (LLM)      │  │   3.3 70B       │      │
│     │ (FastAPI +   │  └─────────────┘  └─────────────────┘      │
│     │  librosa)    │                                            │
│     └──────────────┘                                            │
│                                                                 │
│  External APIs: IPQS · VirusTotal · Google Safe Browsing ·      │
│                 URLHaus · AbuseIPDB · SecurityTrails · MCA21    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Framer Motion, Zustand, Recharts, Vanilla CSS |
| **Backend** | Node.js, Express.js, Socket.io, Multer, `pdf-parse-new` |
| **Audio Microservice** | Python 3.9+, FastAPI, `librosa`, `numpy`, `soundfile` |
| **AI / LLM** | NVIDIA NIM (LLaMA), Groq API (LLaMA 3.3 70B Versatile) |
| **Threat Intel APIs** | VirusTotal, Google Safe Browsing, URLHaus, AbuseIPDB, SecurityTrails |
| **Telecom Intel** | IPQualityScore (live carrier data) |
| **Gov Data** | MCA21 company verification |

---

## 🎭 Running the Demo

For the ultimate judge / evaluator experience, run through the shields in this order:

**Step 1 — Job Shield**
> Upload `demo_job_offer.pdf` or paste a WhatsApp scam message into the text field. Watch the Kavach Link Analyzer fire across all 6 threat intel sources simultaneously while Dual-AI Intelligence verifies the company and renders a scam probability score.

**Step 2 — Voice Shield**
> Click **"Load Sample AI"**. Watch the Neural Synapse Visualizer light up with anomaly arcs as the 9-feature spectral analysis runs. Then click **"Load Sample Human"** to see the contrast. Finally, click **"Record Audio"** to test your own voice live.

**Step 3 — SIM Guard**
> Register a phone number. Open the **Simulation Lab** and hit **"Auto Attack Sequence"**. Watch the live WebSocket telemetry ramp from baseline network health → detected anomaly → confirmed SIM swap → freeze protocol engaged.

---

## 📁 Project Structure

```
kavach/
├── frontend/               # React 19 + Vite app
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── pages/          # Voice Shield, SIM Guard, Job Shield views
│   │   ├── store/          # Zustand state management
│   │   └── services/       # API call wrappers
│   └── public/
│       └── samples/        # Demo audio files (ai_deepfake, real_human)
│
├── backend/                # Node.js / Express API server
│   └── src/
│       ├── routes/         # audio.routes.js, jobscan.routes.js, simswap.routes.js
│       ├── services/       # ai.service.js, companyVerifier.service.js, urlLinkAnalyzer.service.js
│       └── middleware/     # upload.middleware.js
│
├── audio-service/          # Python FastAPI microservice
│   ├── main.py             # FastAPI app entry point
│   └── analyzer.py         # librosa spectral deepfake analysis engine
│
├── docs/                   # Supplementary documentation
├── start-all.sh            # One-command platform launcher
└── kill-all.ps1            # Graceful teardown script
```

---

## 🧪 Audio Sample Sourcing Guide

To test Voice Shield with real-world samples:

**AI / Deepfake Samples:**
- [ElevenLabs](https://elevenlabs.io/) — Free TTS demo, download as `.mp3`
- [HuggingFace Spaces — Bark/VITS](https://huggingface.co/spaces) — Realistic neural TTS
- [Deepfake Audio Dataset](https://huggingface.co/datasets/garystafford/deepfake-audio-detection) — Pre-sorted synthetic clips

**Human / Authentic Samples:**
- [Wikimedia Spoken Wikipedia](https://commons.wikimedia.org/wiki/Category:Spoken_Wikipedia) — Real human recordings
- [LibriSpeech](https://www.openslr.org/12) — Audiobook recordings dataset

Place files in `frontend/public/samples/` named exactly `ai_deepfake.mp3` and `real_human.mp3`.

---

<div align="center">

**KAVACH** &nbsp;·&nbsp; *One platform. Three shields. Zero mercy for scammers.*

<br/>

<img src="https://img.shields.io/badge/Built_in-India_🇮🇳-FF9933?style=flat-square" />
&nbsp;
<img src="https://img.shields.io/badge/Open_Source-MIT-22c55e?style=flat-square" />

</div>
