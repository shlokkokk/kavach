import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioWaveform, Upload, Mic, Square, FileAudio, AlertTriangle, CheckCircle, Info, X, Activity, Play, Pause, Scan } from 'lucide-react';

const startNeuralSynapseVisualizer = (canvas, analyser) => {
  if (!canvas || !analyser) return { cancel: () => {} };
  const ctx = canvas.getContext('2d');
  const freqLen = analyser.frequencyBinCount;
  const timeData = new Uint8Array(freqLen);
  let animId;

  const w = canvas.width;
  const h = canvas.height;

  // Generate sensory neural nodes
  const nodes = Array.from({ length: 60 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    energy: 0,
  }));

  const draw = () => {
    analyser.getByteTimeDomainData(timeData);

    // Dark motion blur
    ctx.fillStyle = 'rgba(2, 6, 23, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // Update nodes
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      n.energy *= 0.92; // decay energy
    });

    // Draw central waveform and lightning
    ctx.beginPath();
    const sliceWidth = w * 1.0 / freqLen;
    let x = 0;

    for (let i = 0; i < freqLen; i++) {
      const v = timeData[i] / 128.0; // 0 to 2
      const y = (v * h) / 2;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      // Lightning strike on high amplitude (anomaly extraction)
      const distFromCenter = Math.abs(v - 1); // 0 to 1
      if (distFromCenter > 0.25 && Math.random() > 0.96) {
        let nearestNode = nodes[0];
        let minDist = Infinity;
        nodes.forEach(n => {
            const d = Math.hypot(n.x - x, n.y - y);
            if(d < minDist) { minDist = d; nearestNode = n; }
        });
        
        if (minDist < 150) {
            // Draw lightning
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, y);
            
            // Jagged line
            const steps = 3;
            for (let j=1; j<=steps; j++) {
                const nextX = x + (nearestNode.x - x) * (j/steps) + (Math.random() - 0.5) * 20;
                const nextY = y + (nearestNode.y - y) * (j/steps) + (Math.random() - 0.5) * 20;
                ctx.lineTo(nextX, nextY);
            }
            
            ctx.strokeStyle = `rgba(0, 255, 178, ${distFromCenter * 1.5})`;
            ctx.lineWidth = 1 + distFromCenter * 2;
            ctx.shadowColor = '#00ffb2';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.restore();

            // Energize node
            nearestNode.energy = Math.min(nearestNode.energy + distFromCenter * 1.5, 1);
        }
      }
      x += sliceWidth;
    }

    // Draw main waveform core
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw node neural connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        if (n1.energy > 0.1 && n2.energy > 0.1) {
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(0, 255, 178, ${Math.min(n1.energy, n2.energy) * (1 - dist/120)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      ctx.beginPath();
      const r = 2 + n.energy * 4;
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      
      if (n.energy > 0.4) {
        ctx.fillStyle = `rgba(0, 255, 178, ${n.energy})`;
        ctx.shadowColor = '#00ffb2';
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + n.energy})`;
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = n.energy * 5;
      }
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    animId = requestAnimationFrame(draw);
  };
  draw();
  return { cancel: () => cancelAnimationFrame(animId) };
};

const CustomAudioPlayer = ({ url }) => {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const vizEngineRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeStr, setTimeStr] = useState("0:00 / 0:00");

  useEffect(() => {
    return () => {
      if (vizEngineRef.current) vizEngineRef.current.cancel();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const setupAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      
      vizEngineRef.current = startNeuralSynapseVisualizer(canvasRef.current, analyser);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      setupAudio();
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    setProgress((current / duration) * 100);
    setTimeStr(`${formatTime(current)} / ${formatTime(duration)}`);
  };

  return (
    <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
      {/* Player Visualizer Canvas */}
      <div style={{ width: '100%', height: '140px', background: 'rgba(6, 14, 26, 0.9)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
        <canvas ref={canvasRef} width={400} height={140} style={{ width: '100%', height: '100%' }} />
        {!playing && progress === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', pointerEvents: 'none', background: 'rgba(6, 14, 26, 0.6)' }}>
            <Play size={16} style={{ marginRight: '8px' }} /> INIT PLAYBACK TO VISUALIZE
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <audio ref={audioRef} src={url} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onTimeUpdate} onEnded={() => setPlaying(false)} crossOrigin="anonymous" />
        <button onClick={togglePlay} className="btn btn-ghost btn-sm" style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '50%' }}>
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #00ffb2)', boxShadow: '0 0 10px rgba(0, 255, 178, 0.8)', transition: 'width 0.1s linear' }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
            {timeStr}
          </div>
        </div>
      </div>
    </div>
  );
};
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
  const [showGlossary, setShowGlossary] = useState(false);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const { addScan } = useKavachStore();

  useEffect(() => {
    if (showGlossary) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      cancelAnimationFrame(animRef.current);
    };
  }, [audioUrl, showGlossary]);

  const onDrop = useCallback((accepted) => {
    if (file) {
      toast.error('Please discard the current audio file before uploading a new one.');
      return;
    }
    if (accepted.length > 0) {
      const f = accepted[0];
      setFile(f);
      setResult(null);
      setAudioUrl(URL.createObjectURL(f));
      toast.success(`${f.name} loaded successfully`);
    }
  }, [file]);

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

  const drawDefaultWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    // Solid clear
    ctx.fillStyle = 'rgba(6, 14, 26, 1)';
    ctx.fillRect(0, 0, w, h);
    
    const baseRadius = Math.min(cx, cy) * 0.28;
    const orbRadius = baseRadius * 0.3;
    const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbRadius * 2);
    orbGrad.addColorStop(0, `rgba(0, 255, 178, 0.3)`);
    orbGrad.addColorStop(0.4, `rgba(59, 130, 246, 0.15)`);
    orbGrad.addColorStop(1, 'rgba(6, 14, 26, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, orbRadius * 2, 0, Math.PI * 2);
    ctx.fillStyle = orbGrad;
    ctx.fill();
    
    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = baseRadius * (1.0 + ring * 0.55);
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      if (ring === 0) {
        ctx.strokeStyle = `rgba(0, 255, 178, 0.5)`;
        ctx.shadowColor = '#00ffb2';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
      } else if (ring === 1) {
        ctx.strokeStyle = `rgba(59, 130, 246, 0.3)`;
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = `rgba(139, 92, 246, 0.2)`;
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  };

  useEffect(() => {
    // Draw the cool default state immediately when component loads
    drawDefaultWaveform();
  }, []);

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
        // Reset canvas to its peaceful, default circle state
        requestAnimationFrame(() => {
          drawDefaultWaveform();
          requestAnimationFrame(drawDefaultWaveform); // double call ensures trails are fully cleared
        });
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
    const freqLen = analyser.frequencyBinCount;
    const freqData = new Uint8Array(freqLen);
    const timeData = new Uint8Array(freqLen);
    const particles = [];
    let rotation = 0;
    
    const draw = () => {
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);
      
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      
      // Compute average volume (0-1)
      let sum = 0;
      for (let i = 0; i < freqLen; i++) sum += freqData[i];
      const avg = sum / freqLen / 255;
      const intensity = Math.pow(avg, 0.6); // Perceptual scaling
      
      // Fade trail
      ctx.fillStyle = 'rgba(6, 14, 26, 0.15)';
      ctx.fillRect(0, 0, w, h);
      
      rotation += 0.003 + intensity * 0.01;
      const baseRadius = Math.min(cx, cy) * 0.28;
      
      // --- Central breathing orb ---
      const orbRadius = baseRadius * (0.3 + intensity * 0.7);
      const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbRadius * 2);
      orbGrad.addColorStop(0, `rgba(0, 255, 178, ${0.3 + intensity * 0.5})`);
      orbGrad.addColorStop(0.4, `rgba(59, 130, 246, ${0.15 + intensity * 0.2})`);
      orbGrad.addColorStop(1, 'rgba(6, 14, 26, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();
      
      // --- Radial frequency rings ---
      const ringCount = 3;
      for (let ring = 0; ring < ringCount; ring++) {
        const ringRadius = baseRadius * (1.0 + ring * 0.55);
        const segments = 64;
        const dataStep = Math.floor(freqLen / segments);
        
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2 + rotation * (ring % 2 === 0 ? 1 : -1);
          const idx = (i % segments) * dataStep;
          const amp = freqData[idx] / 255;
          const spike = amp * baseRadius * (0.4 + ring * 0.15);
          const r = ringRadius + spike;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        if (ring === 0) {
          ctx.strokeStyle = `rgba(0, 255, 178, ${0.5 + intensity * 0.5})`;
          ctx.shadowColor = '#00ffb2';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 2;
        } else if (ring === 1) {
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 + intensity * 0.4})`;
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 + intensity * 0.3})`;
          ctx.shadowColor = '#8b5cf6';
          ctx.shadowBlur = 6;
          ctx.lineWidth = 1;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      // --- Spawn particles on loud moments ---
      if (intensity > 0.25 && Math.random() < intensity) {
        const angle = Math.random() * Math.PI * 2;
        particles.push({
          x: cx + Math.cos(angle) * baseRadius * 1.5,
          y: cy + Math.sin(angle) * baseRadius * 1.5,
          vx: Math.cos(angle) * (1 + intensity * 3),
          vy: Math.sin(angle) * (1 + intensity * 3),
          life: 1.0,
          size: 1 + Math.random() * 2,
          color: Math.random() > 0.5 ? '0, 255, 178' : '59, 130, 246'
        });
      }
      
      // --- Draw & update particles ---
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.015;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.life * 0.8})`;
        ctx.shadowColor = `rgba(${p.color}, 0.5)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      // Cap particles
      if (particles.length > 80) particles.splice(0, particles.length - 80);
      
      // --- Subtle scan line ---
      const scanY = (Date.now() / 20) % h;
      ctx.strokeStyle = 'rgba(0, 255, 178, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();
      
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
        // highIsSuspicious = true  → high % is BAD (red), low % is GOOD (green)
        // highIsSuspicious = false → high % is GOOD (green), low % is BAD (red)
        { label: 'MFCC Anomaly',        value: pickMetric(featureSource, ['mfccAnomaly', 'mfcc_anomaly']),                            highIsSuspicious: true  },
        { label: 'Spectral Flux',       value: pickMetric(featureSource, ['spectralFlux', 'spectral_flux', 'spectral_flux_consistency']), highIsSuspicious: true  },
        { label: 'Voice Print',         value: pickMetric(featureSource, ['voicePrintScore', 'voice_print_score']),                    highIsSuspicious: true  },
        { label: 'Pitch Variance',      value: pickMetric(featureSource, ['pitchVariance', 'pitch_variance']),                         highIsSuspicious: false },
        { label: 'Energy Consistency',  value: pickMetric(featureSource, ['energyConsistency', 'energy_flatness']),                    highIsSuspicious: true  },
        { label: 'Zero Crossing Rate',  value: pickMetric(featureSource, ['zeroCrossingRate', 'zero_crossing_rate']),                  highIsSuspicious: false },
        { label: 'Silence Purity',      value: pickMetric(featureSource, ['silencePurity', 'silence_purity']),                         highIsSuspicious: true  },
        { label: 'High Freq Flatness',  value: pickMetric(featureSource, ['highFreqFlatness', 'high_freq_flatness']),                  highIsSuspicious: true  },
        { label: 'Harmonic Perfection', value: pickMetric(featureSource, ['harmonicPerfection', 'harmonic_perfection']),               highIsSuspicious: true  },
      ]
        .filter((item) => item.value !== null || ['Voice Print', 'Pitch Variance', 'Zero Crossing Rate'].includes(item.label))
        .map((item) => {
          const pct = item.value === null ? null : item.value * 100;
          let color = 'var(--color-muted)';
          if (pct !== null) {
            if (item.highIsSuspicious) {
              // high = red, mid = amber, low = green
              if (pct >= 65) color = 'var(--color-danger)';
              else if (pct >= 35) color = 'var(--color-warning)';
              else color = 'var(--color-safe)';
            } else {
              // inverted: high = green, mid = amber, low = red
              if (pct >= 50) color = 'var(--color-safe)';
              else if (pct >= 25) color = 'var(--color-warning)';
              else color = 'var(--color-danger)';
            }
          }
          return { ...item, normalizedValue: pct, color };
        })
    : [];
  const hasFeatureSignal = features.some((f) => typeof f.normalizedValue === 'number' && f.normalizedValue > 0.1);

  const loadSample = async (type) => {
    if (file) {
      toast.error('Please discard the current audio file before loading a sample.');
      return;
    }
    
    setLoading(true);
    const toastId = toast.loading(`Loading ${type === 'ai' ? 'AI Deepfake' : 'Real Human'} sample...`);
    
    try {
      const baseName = type === 'ai' ? 'ai_deepfake' : 'real_human';
      const extensions = ['mp3', 'wav', 'ogg', 'm4a', 'webm'];
      let foundBlob = null;
      let foundExt = null;

      // Try fetching common extensions until one succeeds
      for (const ext of extensions) {
        try {
          const response = await fetch(`/samples/${baseName}.${ext}`, { method: 'HEAD' });
          if (response.ok) {
            const getResponse = await fetch(`/samples/${baseName}.${ext}`);
            if (getResponse.ok) {
              foundBlob = await getResponse.blob();
              foundExt = ext;
              break;
            }
          }
        } catch (e) {
          // Ignore fetch errors, keep trying other extensions
        }
      }

      if (!foundBlob) {
        throw new Error(`Sample not found. Please place an audio file named '${baseName}.[mp3|wav|ogg|etc]' in public/samples/`);
      }
      
      const fileName = `${baseName}.${foundExt}`;
      const mimeType = foundBlob.type || `audio/${foundExt}`;
      const sampleFile = new File([foundBlob], fileName, { type: mimeType });
      
      setFile(sampleFile);
      setResult(null);
      setAudioUrl(URL.createObjectURL(sampleFile));
      
      toast.success(`${type === 'ai' ? 'AI' : 'Real'} sample loaded`, { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Failed to load sample', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

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
              <div 
                {...getRootProps()} 
                className={`upload-zone ${isDragActive ? 'active' : ''}`} 
                style={{ 
                  background: 'var(--color-surface-2)', 
                  border: `2px dashed ${isDragActive ? '#3b82f6' : file ? 'rgba(239, 68, 68, 0.3)' : 'var(--color-border)'}`,
                  cursor: file ? 'not-allowed' : 'pointer',
                  opacity: file ? 0.8 : 1
                }} 
                id="audio-upload-zone"
              >
                <input {...getInputProps()} disabled={!!file} />
                {file ? (
                  <>
                    <AlertTriangle size={36} style={{ color: '#ef4444', marginBottom: '12px', opacity: 0.8 }} />
                    <p style={{ fontSize: '1rem', marginBottom: '4px', color: '#e2e8f0', fontWeight: 600 }}>Target Audio Locked</p>
                    <p style={{ fontSize: '0.82rem', color: '#ef4444' }}>Discard current file in the capture panel below to upload a new one.</p>
                  </>
                ) : (
                  <>
                    <Upload size={36} style={{ color: '#3b82f6', marginBottom: '12px' }} />
                    <p style={{ fontSize: '1rem', marginBottom: '4px' }}>Drop audio file here or click to browse</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>MP3, WAV, OGG, M4A, WebM — Max 10MB</p>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => loadSample('real')} disabled={!!file || loading}>
                  Load Sample Human
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => loadSample('ai')} disabled={!!file || loading}>
                  Load Sample AI
                </button>
              </div>
            </GlowCard>

            {/* Record */}
            <GlowCard color="info">
              <div className="k-panel-head">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mic size={18} style={{ color: '#3b82f6' }} /> Live Capture
                </h4>
              </div>
              <div className="k-audio-wave-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <canvas ref={canvasRef} width={400} height={200} style={{ width: '100%', height: '200px', borderRadius: '12px', background: 'rgba(6, 14, 26, 0.92)', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.04)' }} />
              </div>
              <div className="k-audio-actions" style={{ marginTop: '10px' }}>
                {file ? (
                  <button className="btn btn-outline btn-sm" onClick={resetAudioSelection} type="button" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <X size={16} /> Discard Current File
                  </button>
                ) : !recording ? (
                  <button className="btn btn-outline btn-sm" onClick={startRecording} id="btn-start-record" style={{ color: '#00ffb2', borderColor: 'rgba(0, 255, 178, 0.3)' }}>
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
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ 
                  background: 'rgba(10, 15, 26, 0.4)', 
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px',
                  display: 'flex', flexDirection: 'column', gap: '16px'
                }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <FileAudio size={20} style={{ color: '#94a3b8' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{file.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                          SIZE: {(file.size / 1024 / 1024).toFixed(2)} MB • FORMAT: {file.name.split('.').pop().toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <span style={{ 
                      padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', 
                      borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, fontFamily: 'var(--font-mono)', border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      [ LOADED ]
                    </span>
                  </div>
                  
                  {audioUrl && <div style={{ margin: '4px 0' }}>
                    <CustomAudioPlayer url={audioUrl} />
                  </div>}
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                    <Info size={14} style={{ color: '#94a3b8', flexShrink: 0, marginTop: '2px' }} />
                    <span>For highest confidence signal, ensure the sample contains at least 8 seconds of continuous, clear speech.</span>
                  </div>
                  
                  <button 
                    onClick={analyzeAudio} disabled={loading}
                    style={{ 
                      width: '100%', padding: '14px', background: loading ? 'rgba(255,255,255,0.03)' : '#0f172a', 
                      color: loading ? '#475569' : '#e2e8f0', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '1px', fontFamily: 'var(--font-mono)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
                    }}
                    onMouseEnter={e => { if(!loading) { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; } }}
                    onMouseLeave={e => { if(!loading) { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                  >
                    {loading ? (
                      <><Activity className="animate-spin" size={16} /> [ PROCESSING_SIGNAL... ]</>
                    ) : (
                      <><Scan size={16} /> [ EXECUTE_ANALYSIS ]</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {loading && <ShieldLoader text="Analyzing audio patterns..." />}
          </div>

          {/* Right: Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Verdict */}
                <GlowCard color={result.isDeepfake ? 'danger' : 'primary'} style={{ position: 'relative' }}>
                  {result.isSimulation && (
                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Activity size={12} /> Demo Output
                      </span>
                    </div>
                  )}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} /> Voice Feature Analysis
                      </h4>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowGlossary(true)} title="What do these metrics mean?" style={{ padding: '4px 8px' }}>
                        <Info size={16} /> <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>Glossary</span>
                      </button>
                    </div>
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
                          <ConfidenceBar key={f.label} value={f.normalizedValue} label={f.label} delay={i * 0.12} color={f.color} />
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

      {/* Glossary Modal */}
      {createPortal(
        <AnimatePresence>
          {showGlossary && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(2, 6, 15, 0.8)', backdropFilter: 'blur(8px)',
                zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
              }}
              onClick={() => setShowGlossary(false)}
            >
              <motion.div 
                initial={{ y: 40, scale: 0.95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 30, scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  background: 'rgba(10, 15, 26, 0.85)', backdropFilter: 'blur(24px)', 
                  border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '16px', 
                  maxWidth: '650px', width: '100%', maxHeight: '85vh', 
                  display: 'flex', flexDirection: 'column', 
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.15)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.5px' }}>
                    <Info size={22} style={{ color: '#3b82f6' }} /> Metric Definitions
                  </h3>
                  <button className="btn btn-ghost" onClick={() => setShowGlossary(false)} style={{ padding: '8px', color: '#94a3b8', borderRadius: '8px' }}>
                    <X size={20} />
                  </button>
                </div>
                
                <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { title: 'MFCC Anomaly', desc: 'Measures unnatural variations in the "vocal tract shape". AI often struggles to seamlessly transition between complex phonetic sounds the way real human throats do.', high: 'Suspicious — synthetic MFCC patterns detected, common in AI voice cloning.', low: 'Healthy — vocal tract transitions look natural and human-like.' },
                    { title: 'Spectral Flux', desc: 'Measures frame-to-frame acoustic changes. Natural speech is highly dynamic; AI speech often has an unnaturally consistent "robotic" flow.', high: 'Suspicious — too uniform/stable, matching AI generation artifacts.', low: 'Healthy — rich acoustic variance, characteristic of real human speech.' },
                    { title: 'Voice Print', desc: 'A composite score tracking the unique acoustic fingerprint. AI voices frequently miss the subtle organic imperfections found in real vocal cords.', high: 'Suspicious — the vocal fingerprint looks generated, not organically human.', low: 'Healthy — fingerprint is chaotic and imperfect, typical of real voices.' },
                    { title: 'Pitch Variance', desc: 'Natural voices fluctuate in pitch due to emotion and breathing. Lower variance indicates a monotonous, potentially synthetic generation.', high: 'Healthy — wide pitch range suggests real emotional inflection.', low: 'Suspicious — monotone or unnaturally flat pitch, a key deepfake tell.' },
                    { title: 'Energy Consistency', desc: 'Real speech has distinct energy dips (like taking breaths). AI models often produce sound with a mathematically flat, unending energy curve.', high: 'Suspicious — energy is too stable, missing natural breath-pause dips.', low: 'Healthy — energy fluctuates naturally with human speech rhythms.' },
                    { title: 'Zero Crossing Rate', desc: 'Measures signal noisiness. Real humans make messy sounds for fricatives like "s", "f", and "z", while AI tends to artificially smooth them out.', high: 'Healthy — noisy signal with real fricative chaos.', low: 'Suspicious — too clean, AI often strips natural high-frequency noise.' },
                    { title: 'Silence Purity', desc: 'Real recordings always have a slight background noise floor. AI often outputs absolute, mathematically perfect silence between words.', high: 'Suspicious — silence is unnaturally clean, a major deepfake indicator.', low: 'Healthy — background noise present, consistent with a real microphone.' },
                    { title: 'High Freq Flatness', desc: 'Detects high-frequency chaos. AI models typically struggle to generate realistic high-frequency noise, opting for smoother, flatter frequency roll-offs.', high: 'Suspicious — high frequencies are too smooth and flat, typical of AI vocoders.', low: 'Healthy — chaotic high-frequency content, consistent with a real voice.' },
                    { title: 'Harmonic Perfection', desc: 'Checks for overly perfect phase and harmonic resonance, a common artifact of neural vocoders trying to recreate human speech.', high: 'Suspicious — harmonics are too perfect. Real vocal cords produce irregular vibrations.', low: 'Healthy — harmonic content is naturally imperfect, like a real human throat.' }
                  ].map((item, idx) => (
                    <motion.div 
                      key={item.title}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + (idx * 0.05) }}
                      style={{ 
                        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)', 
                        border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)'
                      }}
                    >
                      <h5 style={{ color: '#f1f5f9', margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '4px', height: '14px', background: '#3b82f6', borderRadius: '2px', display: 'inline-block' }}></span>
                        {item.title}
                      </h5>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6' }}>{item.desc}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 700, whiteSpace: 'nowrap', marginTop: '1px', color: '#ef4444' }}>HIGH →</span>
                          <span style={{ color: '#fca5a5' }}>{item.high}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 700, whiteSpace: 'nowrap', marginTop: '1px', color: '#00ffb2' }}>LOW →</span>
                          <span style={{ color: '#6ee7b7' }}>{item.low}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </PageWrapper>
  );
}
