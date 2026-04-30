import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Send, Upload, AlertTriangle, CheckCircle, Building2, ExternalLink, ShieldAlert, Lightbulb } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import GlowCard from '../components/shared/GlowCard';
import ScoreGauge from '../components/shared/ScoreGauge';
import ConfidenceBar from '../components/shared/ConfidenceBar';
import ThreatScoreBadge from '../components/shared/ThreatScoreBadge';
import ShieldLoader from '../components/shared/ShieldLoader';
import PageWrapper from '../components/layout/PageWrapper';
import useKavachStore from '../store/kavachStore';
import { jobService } from '../services/moduleServices';
import { SAMPLE_SCAM_MESSAGE } from '../utils/constants';
import toast from 'react-hot-toast';

export default function JobScanner() {
  const [text, setText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { addScan } = useKavachStore();

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setPdfFile(accepted[0]);
      setText('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1, multiple: false,
  });

  const handleScan = async () => {
    if (!text.trim() && !pdfFile) {
      toast.error('Enter message text or upload PDF');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (pdfFile) {
        res = await jobService.scanPDF(pdfFile);
      } else {
        res = await jobService.scanText(text);
      }
      const data = res.data?.data || res.data || res;
      setResult(data);
      addScan({
        id: Date.now().toString(), module: 'Job Shield', moduleColor: '#ef4444',
        input: pdfFile ? pdfFile.name : text.slice(0, 50) + '...',
        threatLevel: data.verdict === 'SCAM' ? 'HIGH' : data.verdict === 'SUSPICIOUS' ? 'MEDIUM' : 'LOW',
        score: data.scamScore, time: new Date().toLocaleTimeString(),
      });
      toast.success('Scan complete');
    } catch (err) {
      toast.error(err.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const highlightRedFlags = (originalText, redFlags) => {
    if (!redFlags || redFlags.length === 0) return originalText;
    let highlighted = originalText;
    redFlags.forEach(flag => {
      if (flag.phrase) {
        const escaped = flag.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        highlighted = highlighted.replace(
          new RegExp(`(${escaped})`, 'gi'),
          `<mark title="${flag.reason || ''}">\$1</mark>`
        );
      }
    });
    return highlighted;
  };

  return (
    <PageWrapper>
      <div className="app-shell">
        <div className="k-page-header">
          <div>
            <h1 className="k-page-title"><FileSearch size={28} style={{ color: '#ef4444' }} /> Job Shield</h1>
            <p className="k-page-subtitle">Multi-source job fraud forensics for text and PDF offers with red-flag explainability.</p>
          </div>
          <div className="badge badge-danger">
            <ShieldAlert size={12} />
            Scam Triage Active
          </div>
        </div>

        <div className={result ? 'module-grid-split' : 'module-grid-single'}>
          {/* Input side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <GlowCard color="danger">
              <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} style={{ color: '#ef4444' }} /> Paste Message
              </h4>
              <textarea
                className="input" value={text}
                onChange={(e) => { setText(e.target.value); setPdfFile(null); }}
                placeholder="Paste the job offer message, WhatsApp text, or SMS here..."
                style={{ minHeight: '200px' }}
                id="job-text-input"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  {text.length} characters
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => { setText(SAMPLE_SCAM_MESSAGE); setPdfFile(null); }} id="btn-load-sample">
                  Load Sample Scam
                </button>
              </div>
            </GlowCard>

            <GlowCard color="danger">
              <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} style={{ color: '#ef4444' }} /> Or Upload PDF
              </h4>
              <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`}
                style={{ padding: '24px', background: 'var(--color-surface-2)', border: `2px dashed ${isDragActive ? '#ef4444' : 'var(--color-border)'}` }}
                id="job-pdf-upload"
              >
                <input {...getInputProps()} />
                {pdfFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileSearch size={20} style={{ color: '#ef4444' }} />
                    <span>{pdfFile.name}</span>
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Drop PDF here or click to browse</p>
                )}
              </div>
            </GlowCard>

            <button className="btn btn-primary btn-lg" onClick={handleScan} disabled={loading || (!text.trim() && !pdfFile)}
              style={{ width: '100%' }} id="btn-scan-job">
              {loading ? 'Scanning...' : '🔍 Scan for Fraud'}
            </button>

            {loading && <ShieldLoader text="AI analyzing message patterns..." />}
          </div>

          {/* Results side */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Score */}
                <GlowCard color={result.verdict === 'SCAM' ? 'danger' : result.verdict === 'SUSPICIOUS' ? 'warning' : 'primary'}>
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <ScoreGauge score={result.scamScore} size={180} label="scam score" />
                    <div style={{ marginTop: '16px' }}>
                      <ThreatScoreBadge level={result.verdict} score={result.scamScore} />
                    </div>
                  </div>
                </GlowCard>

                {/* Red Flags */}
                {result.redFlags && result.redFlags.length > 0 && (
                  <GlowCard color="danger">
                    <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} /> Red Flags ({result.redFlags.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {result.redFlags.map((flag, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                          style={{ padding: '12px', background: 'var(--color-danger-dim)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-danger)' }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>"{flag.phrase}"</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{flag.reason}</div>
                          <span className="badge badge-danger" style={{ marginTop: '6px' }}>{flag.severity}</span>
                        </motion.div>
                      ))}
                    </div>
                  </GlowCard>
                )}

                {/* Green Flags */}
                {result.greenFlags && result.greenFlags.length > 0 && (
                  <GlowCard color="primary">
                    <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} style={{ color: 'var(--color-safe)' }} /> Green Flags
                    </h4>
                    {result.greenFlags.map((g, i) => (
                      <div key={i} style={{ fontSize: '0.88rem', color: 'var(--color-safe)', padding: '4px 0' }}>✓ {g}</div>
                    ))}
                  </GlowCard>
                )}

                {/* Company Verification */}
                {result.companyVerification && (
                  <GlowCard>
                    <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={18} style={{ color: '#f59e0b' }} /> Company Verification
                    </h4>
                    <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--color-muted)' }}>Company</span>
                        <span style={{ fontWeight: 600 }}>{result.companyName || 'Unknown'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-muted)' }}>MCA21 Status</span>
                        <ThreatScoreBadge level={result.companyVerification.found ? 'REAL' : 'FAKE'} />
                      </div>
                      {result.companyVerification.note && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>{result.companyVerification.note}</p>
                      )}
                    </div>
                  </GlowCard>
                )}

                {/* AI Explanation */}
                {result.explanation && (
                  <GlowCard>
                    <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lightbulb size={18} style={{ color: 'var(--color-warning)' }} /> AI Analysis
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
                      "{result.explanation}"
                    </p>
                    {result.recommendedAction && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'var(--color-primary-dim)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>RECOMMENDED ACTION</div>
                        <div style={{ fontSize: '0.88rem' }}>{result.recommendedAction}</div>
                      </div>
                    )}
                  </GlowCard>
                )}

                {/* Highlighted Text */}
                {text && result.redFlags && result.redFlags.length > 0 && (
                  <GlowCard>
                    <h4 style={{ marginBottom: '12px' }}>Flagged Message</h4>
                    <div className="red-flag-text" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.8, padding: '16px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap' }}
                      dangerouslySetInnerHTML={{ __html: highlightRedFlags(text, result.redFlags) }}
                    />
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
