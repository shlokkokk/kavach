from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from analyzer import analyze_audio_file

app = FastAPI(title="KAVACH Audio Analysis Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "KAVACH Audio Analyzer", "version": "1.0.0"}

@app.post("/analyze")
async def analyze(file: UploadFile):
    """Analyze uploaded audio file for deepfake characteristics"""
    
    # Validate file
    allowed_types = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/webm", "audio/flac"]
    if file.content_type and not any(t in file.content_type for t in ["audio", "octet-stream"]):
        raise HTTPException(status_code=400, detail="Only audio files are accepted")
    
    # Read file
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    if len(contents) < 1000:
        raise HTTPException(status_code=400, detail="File too small or corrupted")
    
    # Analyze
    try:
        result = analyze_audio_file(contents, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
