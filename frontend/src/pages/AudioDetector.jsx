import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioWaveform, Upload, Mic, Square, FileAudio, AlertTriangle, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      cancelAnimationFrame(animRef.current);
    };
  }, [audioUrl]);

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

  const resetAudioSelection = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setFile(null);
    setAudioUrl(null);
    setResult(null);
    toast.success('Ready for a fresh recording or upload');
  };

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

  const featureSource = result?.features || null;
  const pickMetric = (obj, keys) => {
    for (const key of keys) {
      if (typeof obj?.[key] === 'number') return obj[key];
    }
    return null;
  };
  const features = featureSource
    ? [
        { label: 'MFCC Anomaly', value: pickMetric(featureSource, ['mfccAnomaly', 'mfcc_anomaly']) },
        { label: 'Spectral Flux', value: pickMetric(featureSource, ['spectralFlux', 'spectral_flux', 'spectral_flux_consistency']) },
        { label: 'Voice Print', value: pickMetric(featureSource, ['voicePrintScore', 'voice_print_score']) },
        { label: 'Pitch Variance', value: pickMetric(featureSource, ['pitchVariance', 'pitch_variance']) },
        { label: 'Energy Consistency', value: pickMetric(featureSource, ['energyConsistency', 'energy_flatness']) },
        { label: 'Zero Crossing Rate', value: pickMetric(featureSource, ['zeroCrossingRate', 'zero_crossing_rate']) },
        { label: 'Silence Purity', value: pickMetric(featureSource, ['silencePurity', 'silence_purity']) },
        { label: 'High Freq Flatness', value: pickMetric(featureSource, ['highFreqFlatness', 'high_freq_flatness']) },
        { label: 'Harmonic Perfection', value: pickMetric(featureSource, ['harmonicPerfection', 'harmonic_perfection']) },
      ]
        .filter((item) => item.value !== null || ['Voice Print', 'Pitch Variance', 'Zero Crossing Rate'].includes(item.label))
        .map((item) => ({
          ...item,
          normalizedValue: item.value === null ? null : item.value * 100,
        }))
    : [];
  const hasFeatureSignal = features.some((f) => typeof f.normalizedValue === 'number' && f.normalizedValue > 0.1);

  return (
    <PageWrapper>
      <div className="app-shell">
        <div className="k-page-header">
          <div>
            <h1 className="k-page-title"><AudioWaveform size={28} style={{ color: '#3b82f6' }} /> Voice Shield</h1>
            <p className="k-page-subtitle">Forensic audio deepfake detection with visual waveform intelligence and live AI confidence scoring.</p>
          </div>
          <div className="badge badge-info">
            <Mic size={12} />
            Real-time Audio Lab
          </div>
        </div>

        <div className="k-audio-layout" style={!result ? { gridTemplateColumns: '1fr' } : {}}>
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
              <div className="k-panel-head">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mic size={18} style={{ color: '#3b82f6' }} /> Record Audio
                </h4>
                {file && (
                  <button className="btn btn-ghost btn-sm" onClick={resetAudioSelection} type="button">
                    Record New Audio
                  </button>
                )}
              </div>
              <div className="k-audio-wave-shell">
                <canvas ref={canvasRef} width={500} height={90} style={{ width: '100%', height: '90px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 14, 26, 0.82)', marginBottom: '8px' }} />
              </div>
              <div className="k-audio-actions" style={{ marginTop: '10px' }}>
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
              <div className="k-inline-metrics" style={{ marginTop: '12px' }}>
                <div className="k-inline-metric">
                  <div className="k-inline-metric-label">Input Mode</div>
                  <div className="k-inline-metric-value">{recording ? 'Recording' : file ? 'Loaded' : 'Standby'}</div>
                </div>
                <div className="k-inline-metric">
                  <div className="k-inline-metric-label">Audio Source</div>
                  <div className="k-inline-metric-value">{file?.type?.includes('audio') ? 'Valid' : 'Waiting'}</div>
                </div>
                <div className="k-inline-metric">
                  <div className="k-inline-metric-label">Threat Engine</div>
                  <div className="k-inline-metric-value">Online</div>
                </div>
              </div>
            </GlowCard>

            {/* File info + analyze */}
            {file && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <GlowCard color="info" className="audio-file-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileAudio size={20} style={{ color: '#3b82f6' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{file.name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    </div>
                    <span className="badge badge-info">Ready</span>
                  </div>
                  {audioUrl && <audio controls src={audioUrl} style={{ width: '100%', marginBottom: '12px' }} />}
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
                    Tip: use 8s+ clean speech for higher signal confidence.
                  </div>
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
                    {!hasFeatureSignal && (
                      <div style={{ marginBottom: '12px', fontSize: '0.8rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                        Low feature signal from this sample. Zero values can be valid model output.
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {features.map((f, i) =>
                        f.normalizedValue === null ? (
                          <div
                            key={f.label}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--color-surface-2)',
                            }}
                          >
                            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{f.label}</span>
                            <span className="badge badge-info">N/A</span>
                          </div>
                        ) : (
                          <ConfidenceBar key={f.label} value={f.normalizedValue} label={f.label} delay={i * 0.12} />
                        )
                      )}
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
