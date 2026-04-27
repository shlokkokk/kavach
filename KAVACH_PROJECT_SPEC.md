# 🛡️ KAVACH — India's Unified Digital Fraud Shield

### Complete Project Specification — Hackathon Build Guide

---

## 📌 Project Overview

**KAVACH** (कवच — meaning "armor/shield" in Sanskrit) is a real-time, AI-powered fraud detection platform that protects Indians from three of the most devastating modern cyberattacks:

1. **Deepfake Voice Calls** — AI-generated voices impersonating bank officials, relatives, HR personnel
2. **SIM Swap Attacks** — Telecom fraud to intercept OTPs and drain bank accounts
3. **Fake Job Offers** — Scam messages/PDFs targeting unemployed youth

These three attacks are **not isolated** — they form a coordinated attack chain. KAVACH is the only platform that detects and stops all three in real time.

### The Real Attack Chain (Your Demo Story)

```
Step 1: Victim receives a fake job offer on WhatsApp       → KAVACH flags it (Module 3)
Step 2: Victim calls back → deepfake HR voice on the line  → KAVACH detects it (Module 1)
Step 3: Scammer performs SIM swap to steal OTP             → KAVACH blocks it (Module 2)
```

**KAVACH catches the scammer at every single step.**

---

## 🎯 Tech Stack

### Frontend

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + custom CSS variables
- **Animations**: Framer Motion (all transitions, page loads, micro-interactions)
- **Icons**: Lucide React
- **Charts/Visualizations**: Recharts
- **Audio Processing (client-side)**: Web Audio API (waveform visualizer)
- **Routing**: React Router v6
- **State Management**: Zustand
- **HTTP Client**: Axios
- **File Upload**: react-dropzone
- **Notifications/Toasts**: react-hot-toast
- **Fonts**: Google Fonts — `Rajdhani` (display, desi-futuristic) + `IBM Plex Mono` (data/code feel)

### Backend

- **Runtime**: Node.js + Express (or Python FastAPI — pick one, spec covers Node)
- **AI/LLM**: NVIDIA NIM API (`meta/llama-3.1-70b-instruct` or `nvidia/nemotron-4-340b-instruct`) for job offer analysis + explanations
- **Audio Analysis**: Python microservice via child_process or separate FastAPI service
- **WebSockets**: Socket.io (for real-time SIM swap alerts)
- **Database**: Firebase Firestore (real-time, offline-capable, free tier)
- **Authentication**: Firebase Auth (optional, for saving scan history)
- **File Storage**: Firebase Storage (audio uploads)
- **Environment**: dotenv

### External APIs & Services

- **NVIDIA NIM API**: OpenAI-compatible endpoint (`https://integrate.api.nvidia.com/v1/chat/completions`)
- **Twilio**: SMS alerts when SIM swap detected
- **MCA21 / Company Verification**: `https://api.mca.gov.in/` (free, government API — for verifying company existence)
- **AbuseIPDB / VirusTotal**: For URL/domain scanning inside job offers
- **Firebase**: Firestore + Auth + Storage

### Python Microservice (Audio Analysis)

- **Language**: Python 3.10+
- **Framework**: FastAPI
- **Libraries**: `librosa`, `numpy`, `scikit-learn`, `torch` (for pre-trained model), `uvicorn`
- **Pre-trained Model**: Use `RawNet2` or `AASIST` (open source deepfake audio detection models from GitHub)
- **Fallback**: If model is too heavy, use MFCC feature extraction + SVM classifier trained on ASVspoof 2019 dataset

---

## 🏗️ Full Project File Structure

```
kavach/
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── kavach-logo.svg
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css                    # CSS variables, global styles, animations
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx           # Top nav with shield logo + live threat counter
│   │   │   │   ├── Sidebar.jsx          # Module navigation sidebar
│   │   │   │   └── PageWrapper.jsx      # Framer Motion page transition wrapper
│   │   │   ├── shared/
│   │   │   │   ├── ThreatScoreBadge.jsx # Red/orange/green pill badge
│   │   │   │   ├── AnimatedNumber.jsx   # Count-up animation for scores
│   │   │   │   ├── PulsingDot.jsx       # Live indicator dot
│   │   │   │   ├── GlowCard.jsx         # Card with animated glow border
│   │   │   │   ├── WaveformVisualizer.jsx # Audio waveform canvas animation
│   │   │   │   ├── ConfidenceBar.jsx    # Animated horizontal progress bar
│   │   │   │   └── AlertToast.jsx       # Custom toast with threat level color
│   │   │   ├── dashboard/
│   │   │   │   ├── ThreatOverview.jsx   # Unified threat score + 3 module status
│   │   │   │   ├── RecentScans.jsx      # Last 10 scans with results
│   │   │   │   ├── ThreatTimeline.jsx   # Recharts line chart of threat history
│   │   │   │   ├── AttackChainDemo.jsx  # Animated attack chain visualization
│   │   │   │   └── StatCards.jsx        # Key stats: scams detected, blocked, etc.
│   │   │   ├── audio/
│   │   │   │   ├── AudioUploader.jsx    # Drag-drop audio file upload
│   │   │   │   ├── AudioRecorder.jsx    # Record from microphone directly
│   │   │   │   ├── WaveformPlayer.jsx   # Play audio + show waveform
│   │   │   │   ├── DeepfakeResult.jsx   # Result card with confidence + reasoning
│   │   │   │   └── VoiceBiometrics.jsx  # Visual breakdown of voice features
│   │   │   ├── simswap/
│   │   │   │   ├── SimMonitor.jsx       # Live monitoring dashboard
│   │   │   │   ├── SimEventFeed.jsx     # Real-time event stream (WebSocket)
│   │   │   │   ├── DeviceFingerprint.jsx # Shows current device profile
│   │   │   │   ├── AlertPanel.jsx       # Active alerts with action buttons
│   │   │   │   └── RiskTimeline.jsx     # Timeline of suspicious activity
│   │   │   └── jobscanner/
│   │   │       ├── MessageInput.jsx     # Paste WhatsApp message
│   │   │       ├── PDFUploader.jsx      # Upload job offer PDF
│   │   │       ├── ScanResult.jsx       # Scam score + highlighted red flags
│   │   │       ├── RedFlagHighlighter.jsx # Text with highlighted suspicious phrases
│   │   │       ├── CompanyVerifier.jsx  # MCA21 company lookup result
│   │   │       └── ExplanationCard.jsx  # AI explanation of why it's a scam (NVIDIA NIM)
│   │   ├── pages/
│   │   │   ├── Landing.jsx              # Hero page with animated attack chain
│   │   │   ├── Dashboard.jsx            # Main dashboard overview
│   │   │   ├── AudioDetector.jsx        # Deepfake audio module page
│   │   │   ├── SimSwap.jsx              # SIM swap monitor page
│   │   │   ├── JobScanner.jsx           # Fake job offer scanner page
│   │   │   └── NotFound.jsx             # 404 page
│   │   ├── hooks/
│   │   │   ├── useAudioAnalysis.js      # Hook for audio upload + analysis
│   │   │   ├── useSimMonitor.js         # Hook for WebSocket SIM events
│   │   │   ├── useJobScan.js            # Hook for job offer scanning
│   │   │   └── useThreatScore.js        # Combined threat score calculation
│   │   ├── store/
│   │   │   └── kavachStore.js           # Zustand global state
│   │   ├── services/
│   │   │   ├── api.js                   # Axios instance + interceptors
│   │   │   ├── audioService.js          # Audio analysis API calls
│   │   │   ├── simService.js            # SIM swap API calls
│   │   │   └── jobService.js            # Job scanner API calls
│   │   └── utils/
│   │       ├── threatCalculator.js      # Unified threat score logic
│   │       ├── fileHelpers.js           # File type validation, size check
│   │       └── constants.js             # App-wide constants
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── index.js                     # Express server entry, Socket.io init
│   │   ├── routes/
│   │   │   ├── audio.routes.js          # POST /api/audio/analyze
│   │   │   ├── simswap.routes.js        # GET/POST /api/sim/*
│   │   │   └── jobscan.routes.js        # POST /api/job/scan
│   │   ├── controllers/
│   │   │   ├── audio.controller.js      # Calls Python microservice
│   │   │   ├── simswap.controller.js    # SIM event processing
│   │   │   └── jobscan.controller.js    # NVIDIA NIM + MCA21 + VirusTotal
│   │   ├── services/
│   │   │   ├── nvidianim.service.js     # NVIDIA NIM API wrapper
│   │   │   ├── mca21.service.js         # MCA21 company lookup
│   │   │   ├── twilio.service.js        # SMS alert sender
│   │   │   ├── firebase.service.js      # Firestore read/write
│   │   │   └── simEventSimulator.js     # Realistic mock SIM event generator
│   │   ├── middleware/
│   │   │   ├── upload.middleware.js     # Multer file upload handler
│   │   │   ├── rateLimit.middleware.js  # Rate limiting
│   │   │   └── error.middleware.js      # Global error handler
│   │   ├── socket/
│   │   │   └── simSwapSocket.js         # Socket.io namespace for SIM events
│   │   └── config/
│   │       ├── firebase.config.js       # Firebase Admin SDK init
│   │       └── constants.js             # Server constants
│   ├── .env.example
│   └── package.json
│
├── audio-service/                       # Python FastAPI microservice
│   ├── main.py                          # FastAPI app entry
│   ├── analyzer.py                      # Audio feature extraction + classification
│   ├── model_loader.py                  # Load pre-trained deepfake detection model
│   ├── requirements.txt
│   └── models/                          # Store downloaded model weights here
│       └── .gitkeep
│
├── docker-compose.yml                   # Run all services together
├── README.md
└── TODO.md                              # Manual setup steps (see separate file)
```

---

## 🎨 UI/UX Design Specification

### Visual Identity

- **Aesthetic**: Dark cybersecurity war room — think ISRO mission control meets hacker terminal
- **Primary Color**: `#00FFB2` (electric mint green — "shield active")
- **Danger Color**: `#FF3B3B` (threat red)
- **Warning Color**: `#FFB800` (amber alert)
- **Safe Color**: `#00C853` (verified green)
- **Background**: `#050A14` (near-black navy)
- **Surface**: `#0D1B2A` (dark card background)
- **Border**: `#1A2E45` (subtle dark border)
- **Text Primary**: `#E8F4FD`
- **Text Muted**: `#6B8CAE`
- **Font Display**: `Rajdhani` (bold, Indian-origin Google Font, perfect for the desi-futuristic feel)
- **Font Mono**: `IBM Plex Mono` (data readouts, scores, percentages)

### CSS Variables (index.css)

```css
:root {
  --color-primary: #00ffb2;
  --color-danger: #ff3b3b;
  --color-warning: #ffb800;
  --color-safe: #00c853;
  --color-bg: #050a14;
  --color-surface: #0d1b2a;
  --color-surface-2: #132236;
  --color-border: #1a2e45;
  --color-text: #e8f4fd;
  --color-muted: #6b8cae;
  --glow-primary: 0 0 20px rgba(0, 255, 178, 0.3);
  --glow-danger: 0 0 20px rgba(255, 59, 59, 0.4);
  --glow-warning: 0 0 20px rgba(255, 184, 0, 0.3);
}
```

### Animations & Transitions (All via Framer Motion)

**Page Transitions**

```jsx
// PageWrapper.jsx — wrap every page with this
const pageVariants = {
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(2px)",
    transition: { duration: 0.2 },
  },
};
```

**Threat Score Number** — animate from 0 to final value on mount (AnimatedNumber.jsx)

**GlowCard** — border color transitions from `--color-border` to `--color-danger/primary` on hover with box-shadow pulse

**PulsingDot** — CSS keyframe scale 1→1.4→1 with opacity change, color based on threat level

**Waveform** — Canvas-based real-time audio waveform using Web Audio API AnalyserNode

**Attack Chain Demo** — SVG path drawing animation (Framer Motion `pathLength` 0→1) showing the 3-step attack flowing between modules

**SIM Event Feed** — new events slide in from right with stagger, old events fade out

**Scan Result Reveal** — score counts up, then red flag phrases highlight one by one with a 100ms stagger

**Loading States** — custom animated shield logo that pulses while API calls are in progress

**Navbar** — glass morphism with `backdrop-filter: blur(20px)`, border bottom glow on active module

---

## 📦 Module 1: Deepfake Audio Detector

### How It Works

1. User uploads `.mp3`, `.wav`, `.ogg`, `.m4a` (max 10MB) OR records via microphone
2. File sent to backend → forwarded to Python microservice
3. Python extracts audio features: MFCC, spectral centroid, chroma, zero crossing rate, mel spectrogram
4. Pre-trained model (AASIST or RawNet2) classifies as REAL vs FAKE
5. Returns confidence score + feature breakdown
6. NVIDIA NIM API generates a human-readable explanation of suspicious patterns

### Backend Route: `POST /api/audio/analyze`

**Request**: `multipart/form-data` with audio file
**Response**:

```json
{
  "isDeepfake": true,
  "confidence": 91.4,
  "label": "AI-GENERATED",
  "features": {
    "mfccAnomaly": 0.87,
    "spectralFlux": 0.23,
    "voicePrintScore": 0.12,
    "breathingPattern": "ABSENT",
    "backgroundNoise": "SYNTHETIC"
  },
  "explanation": "This audio shows strong signs of AI synthesis. Natural human breathing patterns are absent, the spectral flux is unnaturally consistent, and the MFCC coefficients deviate significantly from human vocal tract patterns.",
  "processingTime": 1.2
}
```

### Python Microservice: `POST /analyze`

```python
# analyzer.py — core logic
import librosa
import numpy as np
from fastapi import FastAPI, UploadFile

app = FastAPI()

@app.post("/analyze")
async def analyze_audio(file: UploadFile):
    # Save temp file
    # Load with librosa
    y, sr = librosa.load(temp_path, sr=16000)

    # Extract features
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)
    zero_crossing = librosa.feature.zero_crossing_rate(y)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)

    # Stack features
    features = np.concatenate([
        np.mean(mfcc, axis=1),
        np.std(mfcc, axis=1),
        np.mean(spectral_centroids),
        np.mean(zero_crossing),
        np.mean(chroma, axis=1)
    ])

    # Run through pre-trained model OR trained SVM
    prediction, confidence = model.predict(features)

    return {
        "isDeepfake": bool(prediction),
        "confidence": float(confidence * 100),
        "features": extract_feature_breakdown(y, sr)
    }
```

### UI Components

- **AudioUploader**: Drag-and-drop zone with dashed animated border, accepts audio files, shows file name + waveform preview
- **AudioRecorder**: Mic button that pulses red while recording, shows live waveform, stop button
- **WaveformPlayer**: Canvas waveform that plays back audio, scrubbing enabled
- **DeepfakeResult**: Large confidence circle gauge (SVG animated), REAL/FAKE label with glow, feature breakdown table
- **VoiceBiometrics**: Radar chart (Recharts) showing 6 voice feature scores vs human baseline

---

## 📦 Module 2: SIM Swap Attack Warning

### How It Works

1. User "registers" their phone number (simulation for demo)
2. System creates a device/SIM fingerprint baseline (IMEI hash, sim serial hash, timestamp, location)
3. Backend generates a real-time event stream simulating telecom events
4. WebSocket pushes events to frontend
5. Anomaly detection flags: sudden SIM change + new device + OTP request within 5-minute window
6. HIGH RISK → alert fires → mock bank API freeze → Twilio SMS sent

### WebSocket Events

```javascript
// Events emitted by server via Socket.io
{
  type: "SIM_CHANGE_DETECTED",
  severity: "HIGH",
  timestamp: "2024-01-15T14:32:00Z",
  details: {
    oldSimSerial: "89911234567890123456",
    newSimSerial: "89919876543210987654",
    deviceChanged: true,
    locationChanged: true,
    newLocation: "Mumbai, MH",
    registeredLocation: "Surat, GJ",
    timeSinceLastChange: "never"
  },
  riskScore: 94,
  triggeredRules: ["NEW_SIM_SERIAL", "DEVICE_MISMATCH", "LOCATION_JUMP", "RAPID_OTP_REQUEST"]
}
```

### Anomaly Detection Rules (simswap.controller.js)

```javascript
const RISK_RULES = [
  { id: "NEW_SIM_SERIAL", weight: 30, desc: "SIM serial changed" },
  { id: "DEVICE_MISMATCH", weight: 25, desc: "New device fingerprint" },
  {
    id: "LOCATION_JUMP",
    weight: 20,
    desc: "Location changed > 100km instantly",
  },
  {
    id: "RAPID_OTP_REQUEST",
    weight: 35,
    desc: "OTP requested within 5 min of SIM change",
  },
  { id: "AFTER_HOURS", weight: 10, desc: "Activity between 2AM-5AM" },
  { id: "MULTIPLE_FAILED_AUTH", weight: 15, desc: "3+ failed auth attempts" },
];

function calculateRiskScore(events) {
  // Score = sum of triggered rule weights, capped at 100
  // > 70 = HIGH, 40-70 = MEDIUM, < 40 = LOW
}
```

### Demo Event Simulator (simEventSimulator.js)

```javascript
// Generates realistic SIM event sequence for demo
// Starts with normal events, then triggers attack sequence
// Configurable attack start time (e.g., 30 seconds after demo starts)
function startDemoSequence(socket, phoneNumber) {
  // Phase 1 (0-20s): Normal events — login, balance check
  // Phase 2 (20-25s): SIM change detected
  // Phase 3 (25-30s): OTP request on new SIM
  // Phase 4 (30s): ALERT FIRES — risk score hits 94
  // Phase 5 (30s): Bank freeze + SMS sent
}
```

### UI Components

- **SimMonitor**: Large hexagonal risk gauge in center, pulses red at high risk
- **SimEventFeed**: Scrolling real-time event list, color-coded by severity, new events slide in from right
- **DeviceFingerprint**: Card showing "registered" device vs "current" device with diff highlights
- **AlertPanel**: Full-width red alert banner when HIGH risk, with "Freeze Transactions" and "Mark Safe" buttons
- **RiskTimeline**: Recharts area chart showing risk score over time, annotated with event markers

---

## 📦 Module 3: Fake Job Offer Detector

### How It Works

1. User pastes WhatsApp/SMS text OR uploads PDF job offer
2. Backend extracts text (PDF → pdfparse)
3. Send to NVIDIA NIM API with specialized system prompt
4. LLM returns: scam score, red flags array, company name extracted, explanation
5. Backend separately calls MCA21 API to verify company
6. If URLs in message, check against VirusTotal/Google Safe Browsing
7. Combine all signals → final scam probability

### NVIDIA NIM API Call (nvidianim.service.js)

````javascript
const SYSTEM_PROMPT = `You are KAVACH, India's fraud detection AI specializing in fake job offer analysis.

Analyze the given job offer message or document text and return ONLY a valid JSON object with this exact structure:
{
  "scamScore": <number 0-100>,
  "verdict": "<SCAM|SUSPICIOUS|LEGITIMATE>",
  "companyName": "<extracted company name or null>",
  "redFlags": [
    {
      "phrase": "<exact suspicious phrase from text>",
      "reason": "<why this is suspicious>",
      "severity": "<HIGH|MEDIUM|LOW>"
    }
  ],
  "greenFlags": ["<any legitimacy signals>"],
  "explanation": "<2-3 sentence plain English explanation of verdict>",
  "recommendedAction": "<what user should do>"
}

Common Indian job scam indicators: upfront fees, no interview, guaranteed salary (40k-2L/month), WhatsApp-only contact, Gmail/Yahoo company emails, urgency pressure, typos in company name, promises of work-from-home with no experience required, asking for Aadhaar/bank details early.

Return ONLY the JSON. No preamble. No markdown. No backticks.`;

async function analyzeJobOffer(text) {
  const response = await fetch(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        max_tokens: 1000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze this job offer:\n\n${text}` },
        ],
      }),
    },
  );

  const data = await response.json();
  const raw = data.choices[0].message.content;
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
````

### MCA21 Company Verification (mca21.service.js)

```javascript
async function verifyCompany(companyName) {
  // MCA21 public search API
  const url = `https://efiling.mca.gov.in/eFiling/rest/v1/companySearch?companyName=${encodeURIComponent(companyName)}`;

  try {
    const res = await axios.get(url, { timeout: 5000 });
    const companies = res.data?.companyList || [];

    return {
      found: companies.length > 0,
      registeredName: companies[0]?.companyName || null,
      cin: companies[0]?.cin || null,
      status: companies[0]?.companyStatus || null,
      incorporationDate: companies[0]?.dateOfIncorporation || null,
    };
  } catch {
    return {
      found: false,
      error: "Could not verify — check manually at mca.gov.in",
    };
  }
}
```

### Final Response Schema

```json
{
  "scamScore": 87,
  "verdict": "SCAM",
  "companyName": "Reliance Digital Works Pvt Ltd",
  "companyVerification": {
    "found": false,
    "note": "No company with this name registered in MCA21"
  },
  "redFlags": [
    {
      "phrase": "No experience required, earn ₹45,000/month",
      "reason": "Unrealistic salary promise for zero-experience role",
      "severity": "HIGH"
    },
    {
      "phrase": "Send ₹500 registration fee to confirm your slot",
      "reason": "Legitimate companies NEVER charge candidates",
      "severity": "HIGH"
    }
  ],
  "greenFlags": [],
  "explanation": "This message exhibits multiple classic scam patterns. The unregistered company, upfront fee demand, and unrealistic salary for no-experience work are hallmarks of job fraud that has cost Indians over ₹1,200 crore in 2023.",
  "recommendedAction": "Do not respond. Block this number. Report to cybercrime.gov.in"
}
```

### UI Components

- **MessageInput**: Large textarea with paste button, character count, example prefill button
- **PDFUploader**: Drag-drop PDF zone with preview, extracts text client-side via pdf.js
- **ScanResult**: Animated score reveal — circle gauge counts up to scamScore, color transitions
- **RedFlagHighlighter**: Original message text rendered with suspicious phrases wrapped in `<mark>` with tooltip on hover showing reason
- **CompanyVerifier**: Card with MCA21 logo, company name, status badge (FOUND/NOT FOUND/ERROR)
- **ExplanationCard**: AI's explanation in a styled quote card with "Reported by KAVACH AI" footer

---

## 🎛️ Dashboard Page

### Components

- **ThreatOverview**: Three module status cards side by side — each shows last scan result, timestamp, module status (ACTIVE/IDLE)
- **AttackChainDemo**: SVG animation of the 3-step attack chain — auto-plays on page load, showing how all 3 modules defend against it
- **RecentScans**: Table of last 10 scans across all modules — sortable by threat level
- **ThreatTimeline**: Recharts line chart of scan activity over time (per module, color-coded)
- **StatCards**: 4 stats — "Total Scans", "Threats Detected", "Scams Blocked", "Est. Money Saved"
- **QuickScan**: Input field on dashboard for instant job text scan without navigating away

---

## 🔌 Full API Reference

### Base URL

Development: `http://localhost:4000/api`
Production: Your deployed backend URL

### Endpoints

#### Audio Analysis

```
POST /api/audio/analyze
Content-Type: multipart/form-data
Body: { file: <audio file> }

Response 200:
{
  "success": true,
  "data": {
    "isDeepfake": boolean,
    "confidence": number,        // 0-100
    "label": "AI-GENERATED" | "HUMAN",
    "features": { ... },
    "explanation": string,
    "processingTime": number
  }
}
```

#### SIM Swap

```
POST /api/sim/register
Body: { phoneNumber: string, deviceId: string }

GET /api/sim/status/:phoneNumber
Response: { riskScore, activeAlerts, lastEvent, deviceFingerprint }

POST /api/sim/freeze
Body: { phoneNumber: string }

POST /api/sim/mark-safe
Body: { phoneNumber: string }
```

#### Job Scanner

```
POST /api/job/scan
Content-Type: application/json
Body: { text: string }
OR
Content-Type: multipart/form-data
Body: { file: <pdf file> }

Response 200:
{
  "success": true,
  "data": {
    "scamScore": number,
    "verdict": "SCAM" | "SUSPICIOUS" | "LEGITIMATE",
    "redFlags": [...],
    "greenFlags": [...],
    "explanation": string,
    "companyVerification": { ... },
    "recommendedAction": string
  }
}
```

#### WebSocket Events (Socket.io)

```
// Client connects to: ws://localhost:4000
// Namespace: /sim

// Client emits:
socket.emit("subscribe", { phoneNumber: "9876543210" })
socket.emit("start-demo")   // Triggers demo attack sequence

// Server emits:
socket.on("sim-event", (event) => { ... })      // Every event
socket.on("threat-alert", (alert) => { ... })    // HIGH risk alert
socket.on("bank-frozen", (data) => { ... })      // After freeze
socket.on("sms-sent", (data) => { ... })         // After Twilio alert
```

---

## 🔐 Environment Variables

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend (.env)

```env
PORT=4000
NODE_ENV=development

# NVIDIA NIM
NVIDIA_API_KEY=nvapi-...

# Twilio (for SMS alerts)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Python Audio Service
AUDIO_SERVICE_URL=http://localhost:8000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# CORS
FRONTEND_URL=http://localhost:5173
```

### Python Audio Service (.env)

```env
MODEL_PATH=./models/aasist_model.pt
PORT=8000
MAX_FILE_SIZE_MB=10
```

---

## 🚀 Setup & Run Commands

### Install All Dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# Python service
cd audio-service && pip install -r requirements.txt
```

### Run in Development

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev

# Terminal 2 — Backend
cd backend && npm run dev

# Terminal 3 — Python Audio Service
cd audio-service && uvicorn main:app --reload --port 8000
```

### Or use Docker (all at once)

```bash
docker-compose up --build
```

### Build for Production

```bash
cd frontend && npm run build
cd backend && npm start
```

---

## 🎬 Demo Script (Hackathon Stage — 3 Minutes)

### 0:00-0:30 — Hook

> _"In 2024, Indians lost ₹11,333 crore to cyber fraud. Most of it started with one of three things — a fake job offer, a deepfake voice call, or a SIM swap. KAVACH stops all three."_

### 0:30-1:00 — Attack Chain Animation

Show the Dashboard. Point to the animated attack chain showing how all 3 combine. Let it auto-play.

### 1:00-1:45 — Live Demo: Job Scanner

Paste a pre-prepared fake job offer (WhatsApp screenshot text). Click Scan. Watch score animate to 87%. Show red flags highlighting in the text. Show "Company not found in MCA21". Read the AI's explanation aloud.

### 1:45-2:15 — Live Demo: SIM Swap

Go to SIM Monitor. Click "Start Demo Attack". Watch events appear in real-time feed. Score climbs. At 94% — red alert fires, "Transactions Frozen" banner appears. Show the mock Twilio SMS on phone.

### 2:15-2:45 — Live Demo: Audio Detector

Upload a pre-prepared AI-generated voice clip. Watch waveform render. Result: 91% AI-GENERATED. Show feature breakdown. Show "Breathing pattern: ABSENT".

### 2:45-3:00 — Close

> _"One platform. Three shields. Because scammers don't use one trick — and neither does KAVACH."_

---

## 📐 Key Implementation Notes for AI Builder

1. **Never hardcode scan results** — all scores/results come from live API calls
2. **Never hardcode company verification** — always call MCA21 API, show actual result
3. **Demo mode is still dynamic** — SIM event simulator generates realistic random timestamps and data, not static arrays
4. **Audio model must be real** — download AASIST or RawNet2 weights, do real feature extraction. If model too heavy for demo, use scikit-learn SVM trained on a small subset of ASVspoof 2019 dataset
5. **NVIDIA NIM response always parsed from API** — never return a hardcoded explanation
6. **All animations use Framer Motion** — no CSS animation hacks for major transitions
7. **Socket.io connection must be real** — events come from server, not setTimeout on client
8. **Firebase stores all scan history** — persists across sessions
9. **Error states must be handled gracefully** — show friendly error cards, never crash
10. **Mobile responsive** — the dashboard should work on phone (judges may check on mobile)
11. **Loading states for everything** — no blank screens during API calls, always show animated shield loader
12. **Confidence bars animate on mount** — don't just appear at final value
13. **Dark theme is mandatory** — no light mode, this is a security tool

---

## 🧪 Sample Test Data (For Demo)

### Fake Job Offer Message (paste this for demo)

```
Congratulations! You have been selected for Work From Home job at Reliance Digital Works Pvt Ltd.
Salary: 45,000/month. No experience required. Only 2 hours daily work.
To confirm your slot, pay ₹500 registration fee via GPay to 9876543210.
WhatsApp us immediately: wa.me/919876543210
Limited seats! Apply fast. Interview waived for selected candidates.
HR Manager: Priya Sharma | hr.reliancedigitalworks@gmail.com
```

### Deepfake Audio

- Download sample from: `https://www.kaggle.com/datasets/birdy654/deep-voice-deepfake-voice-recognition` (ASVspoof dataset — free)
- Use a spoof sample from this dataset for demo

---

## 📊 Scoring Rubric (How You Win)

| Criteria        | How KAVACH Scores                                                 |
| --------------- | ----------------------------------------------------------------- |
| Innovation      | ✅ First unified 3-in-1 fraud detection platform in India         |
| Technical Depth | ✅ Real ML model + NVIDIA NIM API + WebSockets + real APIs        |
| Social Impact   | ✅ Addresses ₹11,333 crore annual cyber fraud problem             |
| Demo Quality    | ✅ Live animated attack chain, real-time events, live AI analysis |
| Feasibility     | ✅ All tech is proven, APIs are free/cheap, deployable today      |
| UI/UX           | ✅ Cyberpunk war room aesthetic, smooth Framer Motion animations  |

---

_Built for hackathon — but designed for India. KAVACH._

okay so i want u to build this project that is in the md file you dont need to keep exact structure or functionality this is like minimum thats needed and expected you have to do a lot more better and perfect than this it jus needs some main features of it 100% working fully as this is for my hackathon also a very big main project Deepfake Audio Detector
SIM Swap Detection
Fake Job Offer Detector stuff like this etc. you can add way more creative and unique and innovative things to it make it look 10x more better than the pdf i provided you and just make it happen just use your brain i want something really very very good
okay also like use this ass refernce and also after project is done and you need me to do smtg manually just tell me like make a todo md file for me stuff for me to do manually and do or add i will do it okay just guide me fully like all steps from simple simple to like all full step by step how to do and what to do okay also make a readme file of full for project and a personal abt file containing all everything about the project+inside info inside all working and everything it willl be a private doc for me only so i understand full project and its working and everything so when judges ask i can answer them properly and all okay so yeah go ahead and get started and we should use models from https://build.nvidia.com/models right there are free and super powerful ig too idk maybe also no need to follow this exact path or something if you have something more better creative and super cool in mind this is just for refernce this md file okay

