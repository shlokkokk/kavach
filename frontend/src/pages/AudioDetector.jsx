import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioWaveform, Upload, Mic, MicOff, Play, Square, FileAudio, AlertTriangle, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import GlowCard from '../components/shared/GlowCard';
import ScoreGauge from '../components/shared/ScoreGauge';
import ConfidenceBar from '../components/shared/ConfidenceBar';
import ThreatScoreBadge from '../components/shared/ThreatScoreBadge';
import ShieldLoader from '../components/shared/ShieldLoader';
import PageWrapper from '../components/layout/PageWrapper';
import useKavachStore from '../store/kavachStore';
import { audioService } from '../services/moduleServices';
import { ACCEPTED_AUDIO_TYPES, MAX_AUDIO_SIZE } from '../utils/constants';
import toast from 'react-hot-toast';

export default function AudioDetector() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const { addScan } = useKavachStore();

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      const f = accepted[0];
      if (f.size > MAX_AUDIO_SIZE) {
        toast.error('File too large. Max 10MB.');
        return;
      }
      setFile(f);
      setAudioUrl(URL.createObjectURL(f));
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_AUDIO_TYPES,
    maxFiles: 1,
    multiple: false,
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const f = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setFile(f);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animRef.current);
      };
      
      mediaRecorder.current.start();
      setRecording(true);
      drawWaveform();
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    const bufLen = analyser.frequencyBinCount;
    const dataArr = new Uint8Array(bufLen);
    
    const draw = () => {
      // Use frequency data for cooler jumping bars
      analyser.getByteFrequencyData(dataArr);
      ctx.fillStyle = '#030810'; // Match app background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufLen) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufLen; i++) {
        // Boost low frequencies visually
        const barHeight = (dataArr[i] / 255) * canvas.height * 1.5;
        
        // Neon gradient
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, '#00ffb2');
        grad.addColorStop(1, '#3b82f6');
        
        ctx.fillStyle = grad;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00ffb2';
        
        // Draw symmetrical bars from center
        const h = Math.max(barHeight / 2, 2); // Minimum 2px height
        ctx.fillRect(x, canvas.height / 2 - h, barWidth - 1, h * 2);
        
        x += barWidth + 1;
      }
      
      ctx.shadowBlur = 0;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const analyzeAudio = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await audioService.analyze(file);
      const data = res.data?.data || res.data || res;
      setResult(data);
      addScan({
        id: Date.now().toString(),
        module: 'Voice Shield',
        moduleColor: '#3b82f6',
        input: file.name,
        threatLevel: data.isDeepfake ? 'HIGH' : 'LOW',
        score: Math.round(data.confidence),
        time: new Date().toLocaleTimeString(),
      });
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const features = result?.features ? [
    { label: 'MFCC Anomaly', value: (result.features.mfccAnomaly || 0) * 100 },
    { label: 'Spectral Flux', value: (result.features.spectralFlux || 0) * 100 },
    { label: 'Voice Print', value: (result.features.voicePrintScore || 0) * 100 },
    { label: 'Pitch Variance', value: (result.features.pitchVariance || 0) * 100 },
    { label: 'Energy Consistency', value: (result.features.energyConsistency || 0) * 100 },
    { label: 'Zero Crossing Rate', value: (result.features.zeroCrossingRate || 0) * 100 },
  ] : [];

  return (
    <PageWrapper>
      <div style={{ maxWidth: '1200px' }}>
        <div className="page-header">
          <h1><AudioWaveform size={28} style={{ color: '#3b82f6' }} /> Voice Shield</h1>
          <p>Upload or record audio to detect AI-generated deepfake voices</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* Left: Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Upload Zone */}
            <GlowCard color="info">
              <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`} style={{ background: 'var(--color-surface-2)', border: `2px dashed ${isDragActive ? '#3b82f6' : 'var(--color-border)'}` }} id="audio-upload-zone">
                <input {...getInputProps()} />
                <Upload size={36} style={{ color: '#3b82f6', marginBottom: '12px' }} />
                <p style={{ fontSize: '1rem', marginBottom: '4px' }}>Drop audio file here or click to browse</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>MP3, WAV, OGG, M4A, WebM — Max 10MB</p>
              </div>
            </GlowCard>

            {/* Record */}
            <GlowCard color="info">
              <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={18} style={{ color: '#3b82f6' }} /> Record Audio
              </h4>
              <canvas ref={canvasRef} width={500} height={80} style={{ width: '100%', height: '80px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', marginBottom: '12px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                {!recording ? (
                  <button className="btn btn-outline btn-sm" onClick={startRecording} id="btn-start-record">
                    <Mic size={16} /> Start Recording
                  </button>
                ) : (
                  <button className="btn btn-danger btn-sm" onClick={stopRecording} id="btn-stop-record">
                    <Square size={16} /> Stop Recording
                  </button>
                )}
              </div>
            </GlowCard>

            {/* File info + analyze */}
            {file && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <GlowCard color="info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <FileAudio size={20} style={{ color: '#3b82f6' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{file.name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                  {audioUrl && <audio controls src={audioUrl} style={{ width: '100%', marginBottom: '12px' }} />}
                  <button className="btn btn-primary" onClick={analyzeAudio} disabled={loading} style={{ width: '100%' }} id="btn-analyze-audio">
                    {loading ? 'Analyzing...' : 'Analyze for Deepfake'}
                  </button>
                </GlowCard>
              </motion.div>
            )}

            {loading && <ShieldLoader text="Analyzing audio patterns..." />}
          </div>

          {/* Right: Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Verdict */}
                <GlowCard color={result.isDeepfake ? 'danger' : 'primary'}>
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <ScoreGauge score={result.confidence} size={180} label="confidence" color={result.isDeepfake ? 'var(--color-danger)' : 'var(--color-safe)'} />
                    <div style={{ marginTop: '16px' }}>
                      <ThreatScoreBadge level={result.isDeepfake ? 'FAKE' : 'REAL'} score={Math.round(result.confidence)} />
                    </div>
                    <p style={{ marginTop: '12px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                      {result.isDeepfake ? 'This audio shows signs of AI generation' : 'This audio appears to be genuine human speech'}
                    </p>
                  </div>
                </GlowCard>

                {/* Features */}
                {features.length > 0 && (
                  <GlowCard>
                    <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} /> Voice Feature Analysis
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {features.map((f, i) => (
                        <ConfidenceBar key={f.label} value={f.value} label={f.label} delay={i * 0.15} />
                      ))}
                    </div>
                  </GlowCard>
                )}

                {/* Indicators */}
                {result.features && (
                  <GlowCard>
                    <h4 style={{ marginBottom: '12px' }}>Key Indicators</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: 'Breathing Pattern', val: result.features.breathingPattern || 'N/A' },
                        { label: 'Background Noise', val: result.features.backgroundNoise || 'N/A' },
                      ].map(ind => (
                        <div key={ind.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{ind.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: ind.val === 'ABSENT' || ind.val === 'SYNTHETIC' ? 'var(--color-danger)' : 'var(--color-safe)' }}>{ind.val}</span>
                        </div>
                      ))}
                    </div>
                  </GlowCard>
                )}

                {/* AI Explanation */}
                {result.explanation && (
                  <GlowCard>
                    <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {result.isDeepfake ? <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} /> : <CheckCircle size={18} style={{ color: 'var(--color-safe)' }} />}
                      AI Analysis
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
                      "{result.explanation}"
                    </p>
                    <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                      — KAVACH AI Analysis • {result.processingTime ? `${result.processingTime}s` : '~1s'}
                    </div>
                  </GlowCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  );
}
