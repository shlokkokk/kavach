# 📋 KAVACH — Manual Setup TODO

Things YOU need to do manually. Follow step by step.

---

## ✅ Step 1: Get Groq API Key (REQUIRED for Job Shield AI)

1. Open browser → go to **https://console.groq.com/keys**
2. Click **"Login"** (top right) and sign in with Google/GitHub
3. Once logged in, click **"Create API Key"**
4. Give it a name (e.g., "KAVACH") and click Submit
5. Copy the key (starts with `gsk_...`)
6. Open file: `backend/.env`
7. Add your actual key like this:
   ```
   GROQ_API_KEY=gsk_PASTE-YOUR-KEY-HERE
   ```
8. Save the file. Restart backend if running.

> **Note**: Without this key, Job Shield will still work using the built-in heuristic fallback analyzer. The Groq API just makes the explanations much better and more natural.

---

## ✅ Step 2: Install Python Dependencies (OPTIONAL — for Voice Shield audio analysis)

The Voice Shield works without Python (it has a fallback in the Node.js backend), but for REAL audio analysis with librosa:

1. Make sure Python 3.10+ is installed:
   ```bash
   python --version
   ```
2. Install dependencies:
   ```bash
   cd audio-service
   pip install -r requirements.txt
   ```
3. Start the audio service:
   ```bash
   python main.py
   ```
   You should see: `Uvicorn running on http://0.0.0.0:8000`

> **If librosa fails to install**: That's OK! The Node.js backend has a built-in fallback that generates realistic analysis results. You can demo everything without Python.

---

## ✅ Step 3: Running the Full App

Open 3 terminal windows:

### Terminal 1 — Frontend
```bash
cd frontend
npm run dev
```
→ Opens on **http://localhost:5173**

### Terminal 2 — Backend
```bash
cd backend
npm run dev
```
→ Runs on **http://localhost:4000**

### Terminal 3 — Audio Service (optional)
```bash
cd audio-service
python main.py
```
→ Runs on **http://localhost:8000**

---

## ✅ Step 4: Demo Prep

### Job Shield Demo
1. Go to **Job Shield** page
2. Click **"LOAD SAMPLE SCAM"** button (loads a pre-made scam message)
3. Click **"SCAN FOR FRAUD"**
4. Watch the score animate, red flags appear, company verification show

### SIM Guard Demo
1. Go to **SIM Guard** page
2. Enter any phone number: `9876543210`
3. Click **"START MONITORING"**
4. Click **"START DEMO ATTACK"**
5. Watch events stream in real-time over 28 seconds
6. See the risk score climb to 94+
7. Red alert banner appears → Click **"FREEZE NOW"**
8. Transactions frozen banner appears

### Voice Shield Demo
1. Download a sample audio file (any MP3/WAV will work)
2. Or use the **microphone** to record your voice
3. Go to **Voice Shield** page
4. Drop the file or click to upload
5. Click **"ANALYZE FOR DEEPFAKE"**
6. Watch the score gauge, feature bars, and AI explanation

---

## 🔧 Optional Enhancements (If You Have Time)

- [ ] **Get sample deepfake audio**: Download from https://www.kaggle.com/datasets/birdy654/deep-voice-deepfake-voice-recognition
- [ ] **Integrate your ZeroRisk Sentinel phishing scanner** — There's a placeholder route at `/api/phishing` ready for it
- [ ] **Add your own branding**: Update the shield icon, add team name to footer
- [ ] **Deploy to Vercel/Railway**: 
  - Frontend → Vercel (`npm run build` then deploy `dist/`)
  - Backend → Railway (one-click deploy)
- [ ] **Add Firebase** for persistent scan history (optional for demo)

---

## 🐛 Troubleshooting

### "Backend connection failed" toast
- Make sure backend is running on port 4000
- Check: http://localhost:4000/api/health

### "Audio analysis failed"
- Python service may not be running — that's OK, the backend has a fallback
- Or restart the backend

### Job Shield shows "Scan failed"
- Check if NVIDIA API key is set in `backend/.env`
- Even without the key, the fallback heuristic analyzer will work

### SIM Guard events not appearing
- Make sure backend is running (WebSocket needs it)
- Try refreshing the page and re-registering the phone number

---

*You got this! 🏆*
