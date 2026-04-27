# KAVACH 🛡️ | AI Fraud Shield

**Industry-Grade Cybersecurity Platform for Real-Time Fraud Detection**

KAVACH is a comprehensive, multi-modal cybersecurity platform designed to protect users from modern AI-driven scams. Developed for HackBaroda 2026, it leverages advanced signal processing, machine learning, and real-time network monitoring to identify and neutralize fraudulent activities before they can cause harm.

## 🚀 Key Modules

### 1. 🎙️ Audio Forensic Engine
A mathematically robust deepfake detection system that identifies AI-generated voices.
- **Spectral Analysis**: Detects unnaturally low noise floors (Silence Purity).
- **Harmonic Consistency**: Measures vocal tract "perfection" against organic human variance.
- **Dynamic Weighting**: Automatically adjusts analysis based on audio compression (MP3 vs. WAV).

### 📱 2. SIM Guard (SIM Swap Detection)
Real-time monitoring of telecom network events to prevent identity theft.
- **WebSocket Integration**: Live event feed for unauthorized SIM change requests.
- **Instant Bank Freeze**: Automated defense mechanism to lock transactions the moment a threat is detected.
- **Risk Scoring**: Real-time confidence gauge for network anomalies.

### 📄 3. Job Shield (Scam Scanner)
AI-powered analysis of job offers, recruitment messages, and fraudulent PDFs.
- **NLP Analysis**: Uses LLMs (Llama-3 via Groq) to detect high-pressure tactics and phishing language.
- **MCA21 Verification**: Cross-references company names with the Ministry of Corporate Affairs database.
- **Red-Flag Highlighting**: Visually identifies specific fraudulent phrases within documents.

## 🛠️ Tech Stack
- **Frontend**: React.js, Framer Motion, Lucide Icons, Tailwind-inspired Vanilla CSS.
- **Backend**: Node.js (Express), Socket.io.
- **AI Service**: Python (FastAPI), Librosa (DSP), Groq API (LLM).
- **Architecture**: Microservices-based Monorepo.

## 🏁 Presentation Demo
- **Audio**: Upload `realistic_ai_scam.mp3` to see the heuristic engine in action.
- **SIM**: Click "Start Demo Attack" to witness a live simulated network breach.
- **Job**: Paste a suspicious message to see the AI identify red flags and verify company registry.

---
**Developed with ❤️ for HackBaroda 2026**
