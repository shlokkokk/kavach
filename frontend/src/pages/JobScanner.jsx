import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Send, Upload, AlertTriangle, CheckCircle, Landmark, ShieldAlert, Lightbulb, Link2, RotateCcw } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import GlowCard from '../components/shared/GlowCard';
import ScoreGauge from '../components/shared/ScoreGauge';
import ThreatScoreBadge from '../components/shared/ThreatScoreBadge';
import ShieldLoader from '../components/shared/ShieldLoader';
import PageWrapper from '../components/layout/PageWrapper';
import useKavachStore from '../store/kavachStore';
import { jobService } from '../services/moduleServices';
import { SAMPLE_SCAM_MESSAGE } from '../utils/constants';
import toast from 'react-hot-toast';

const SectionLabel = ({ icon, text }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--color-muted)',
    fontSize: '0.72rem',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.1em',
    marginBottom: '-8px',
    paddingLeft: '4px'
  }}>
    {icon}
    <span>{text}</span>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--color-border), transparent)', marginLeft: '10px' }} />
  </div>
);

export default function JobScanner() {
  const [text, setText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { addScan } = useKavachStore();
  const hasActiveScan = Boolean(result);

  const onDrop = useCallback((accepted) => {
    if (hasActiveScan || pdfFile) {
      toast.error('Discard current scan before uploading a new file.');
      return;
    }
    if (accepted.length > 0) {
      setPdfFile(accepted[0]);
    }
  }, [hasActiveScan, pdfFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1, multiple: false, disabled: hasActiveScan || !!pdfFile,
  });

  const handleScan = async () => {
    if (hasActiveScan) {
      toast.error('Discard current scan before starting a new one.');
      return;
    }
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
      if (data.extractedText) {
        setText(data.extractedText);
      }
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

  const resetJobScan = () => {
    setText('');
    setPdfFile(null);
    setResult(null);
    setLoading(false);
    toast.success('Cleared current scan. Ready for a fresh check.');
  };

  const highlightRedFlags = (originalText, redFlags) => {
    let highlighted = originalText;

    // Highlight URLs very lightly - subtle slate blue with thin dashed underline
    const urlPattern = /(https?:\/\/[^\s<>'"()]+|www\.[^\s<>'"()]+|(?:[a-z0-9-]+\.)+(?:com|org|net|me|xyz|ly|gl|co|in|tk|info|zip|top|click)\/[^\s<>'"()]*)/gi;
    highlighted = highlighted.replace(urlPattern, (url) => {
      return `<span style="color: var(--color-text-secondary); border-bottom: 1px dashed rgba(148, 179, 208, 0.4); opacity: 0.9;">${url}</span>`;
    });

    if (!redFlags || redFlags.length === 0) return highlighted;
    
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

  const getLinkVerdictStyle = (verdict) => {
    if (verdict === 'HIGH_RISK') {
      return {
        border: 'var(--color-danger)',
        bg: 'var(--color-danger-dim)',
        pillBg: 'rgba(239, 68, 68, 0.2)',
        pillColor: 'var(--color-danger)',
      };
    }
    if (verdict === 'MEDIUM_RISK') {
      return {
        border: 'rgba(239, 68, 68, 0.75)',
        bg: 'rgba(239, 68, 68, 0.1)',
        pillBg: 'rgba(239, 68, 68, 0.16)',
        pillColor: 'rgba(248, 113, 113, 1)',
      };
    }
    if (verdict === 'LOW_RISK' || verdict === 'SAFE') {
      return {
        border: 'var(--color-info)',
        bg: 'var(--color-info-dim)',
        pillBg: 'rgba(59, 130, 246, 0.2)',
        pillColor: 'var(--color-info)',
      };
    }
    return {
      border: 'rgba(239, 68, 68, 0.55)',
      bg: 'rgba(239, 68, 68, 0.08)',
      pillBg: 'rgba(239, 68, 68, 0.12)',
      pillColor: 'rgba(252, 165, 165, 1)',
    };
  };

  const getSeverityStyle = (severity) => {
    if (severity === 'HIGH') {
      return {
        border: 'var(--color-danger)',
        bg: 'var(--color-danger-dim)',
        text: 'var(--color-danger)',
        badgeStyle: { background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' },
      };
    }
    if (severity === 'MEDIUM') {
      return {
        border: 'rgba(239, 68, 68, 0.75)',
        bg: 'rgba(239, 68, 68, 0.1)',
        text: 'rgba(248, 113, 113, 1)',
        badgeStyle: { background: 'rgba(239, 68, 68, 0.16)', color: 'rgba(248, 113, 113, 1)' },
      };
    }
    if (severity === 'SAFE' || severity === 'LOW') {
      return {
        border: 'var(--color-info)',
        bg: 'var(--color-info-dim)',
        text: 'var(--color-info)',
        badgeStyle: { background: 'rgba(59, 130, 246, 0.2)', color: 'var(--color-info)' },
      };
    }
    return {
      border: 'rgba(148, 163, 184, 0.55)',
      bg: 'rgba(148, 163, 184, 0.08)',
      text: 'rgba(148, 163, 184, 1)',
      badgeStyle: { background: 'rgba(148, 163, 184, 0.12)', color: 'rgba(148, 163, 184, 1)' },
    };
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
        <div className="k-inline-metrics">
          <div className="k-inline-metric">
            <div className="k-inline-metric-label">Input channels</div>
            <div className="k-inline-metric-value">Text + PDF</div>
          </div>
          <div className="k-inline-metric">
            <div className="k-inline-metric-label">Company verification</div>
            <div className="k-inline-metric-value">MCA-linked</div>
          </div>
          <div className="k-inline-metric">
            <div className="k-inline-metric-label">Current verdict</div>
            <div className="k-inline-metric-value">{result?.verdict || 'Awaiting scan'}</div>
          </div>
        </div>

        <div className="job-scanner-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Row 1: Input & Summary */}
          <div className={result ? 'module-grid-split' : 'module-grid-single'}>
            <div className="input-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <SectionLabel icon={<Upload size={14} />} text="ANALYSIS SOURCE" />
              
              <GlowCard color={pdfFile ? "primary" : "danger"}>
                <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pdfFile ? <FileSearch size={18} style={{ color: 'var(--color-primary)' }} /> : <Send size={18} style={{ color: '#ef4444' }} />}
                  {pdfFile ? (result ? 'Extracted PDF Text' : 'PDF Source Mode') : 'Paste Message'}
                </h4>
                
                {pdfFile ? (
                  <div style={{
                    minHeight: '180px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    color: result ? 'var(--color-text)' : 'var(--color-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6
                  }}>
                    {text ? text : 'Text will be extracted from the PDF during forensic analysis...'}
                  </div>
                ) : (
                  <textarea
                    className="input" value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste the job offer message, WhatsApp text, or SMS here..."
                    style={{ minHeight: '180px' }}
                    id="job-text-input"
                    disabled={hasActiveScan}
                  />
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                    {pdfFile ? (text ? `${text.length} characters extracted` : 'Pending extraction') : `${text.length} characters`}
                  </span>
                  {!pdfFile && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (hasActiveScan) {
                          toast.error('Discard current scan before loading sample.');
                          return;
                        }
                        setText(SAMPLE_SCAM_MESSAGE);
                      }}
                      id="btn-load-sample"
                      disabled={hasActiveScan}
                    >
                      Load Sample Scam
                    </button>
                  )}
                </div>
              </GlowCard>

              <GlowCard color="danger">
                <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={18} style={{ color: '#ef4444' }} /> Or Upload PDF
                </h4>
                <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`}
                  style={{
                    padding: '20px',
                    background: 'var(--color-surface-2)',
                    border: `2px dashed ${isDragActive ? '#ef4444' : 'var(--color-border)'}`,
                    cursor: hasActiveScan || pdfFile ? 'not-allowed' : 'pointer',
                    opacity: hasActiveScan || pdfFile ? 0.75 : 1,
                  }}
                  id="job-pdf-upload"
                >
                  <input {...getInputProps()} disabled={hasActiveScan || !!pdfFile} />
                  {pdfFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileSearch size={20} style={{ color: '#ef4444' }} />
                      <span>{pdfFile.name}</span>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Drop PDF here or click to browse</p>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={async () => {
                      if (hasActiveScan || pdfFile) {
                        toast.error('Discard current scan before loading sample.');
                        return;
                      }
                      try {
                        toast.loading('Fetching demo PDF...', { id: 'pdf-load' });
                        const response = await fetch('/samples/demo_job_offer.pdf');
                        const blob = await response.blob();
                        const file = new File([blob], "demo_job_offer.pdf", { type: "application/pdf" });
                        setPdfFile(file);
                        toast.success('Loaded Demo PDF', { id: 'pdf-load' });
                      } catch (err) {
                        toast.error('Failed to load demo PDF', { id: 'pdf-load' });
                      }
                    }}
                    disabled={hasActiveScan || !!pdfFile}
                  >
                    Load Demo PDF
                  </button>
                </div>
              </GlowCard>

              <button className="btn btn-primary btn-lg" onClick={handleScan} disabled={loading || hasActiveScan || (!text.trim() && !pdfFile)}
                style={{ width: '100%' }} id="btn-scan-job">
                {loading ? 'Scanning...' : '🔍 Scan for Fraud'}
              </button>

              {(text.trim() || pdfFile || result) && (
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={resetJobScan}
                  disabled={loading}
                  style={{ width: '100%', color: '#94a3b8', borderColor: 'rgba(148, 163, 184, 0.35)' }}
                >
                  <RotateCcw size={14} /> Discard Current Scan
                </button>
              )}

              {loading && <ShieldLoader text="AI analyzing message patterns..." />}
            </div>

            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="summary-section" 
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  <SectionLabel icon={<ShieldAlert size={14} />} text="SCAM VERDICT" />
                  
                  {/* Score */}
                  <GlowCard color={result.verdict === 'SCAM' ? 'danger' : result.verdict === 'SUSPICIOUS' ? 'warning' : 'primary'}>
                    <div style={{ textAlign: 'center', padding: '5px 0' }}>
                      <ScoreGauge score={result.scamScore} size={160} label="scam score" />
                      <div style={{ marginTop: '12px' }}>
                        <ThreatScoreBadge level={result.verdict} score={result.scamScore} />
                      </div>
                    </div>
                  </GlowCard>

                  {/* AI Analysis (Catchy Style) */}
                  {result?.explanation && (
                    <GlowCard color="primary">
                      <div style={{ 
                        padding: '4px',
                        background: 'rgba(0, 255, 178, 0.03)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                          <Lightbulb size={20} className="animate-pulse-glow" /> AI Neural Insight
                        </h4>
                        <p style={{ 
                          fontSize: '1.05rem', 
                          color: '#e0fff0', 
                          lineHeight: 1.6, 
                          fontWeight: 500,
                          padding: '16px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(0, 255, 178, 0.1)',
                          borderRadius: 'var(--radius-md)',
                          position: 'relative',
                          textShadow: '0 0 20px rgba(0, 255, 178, 0.2)'
                        }}>
                          <span style={{ 
                            position: 'absolute', 
                            top: '-10px', 
                            left: '10px', 
                            background: 'var(--color-surface)', 
                            padding: '0 8px', 
                            fontSize: '0.65rem', 
                            color: 'var(--color-primary)', 
                            fontFamily: 'var(--font-mono)' 
                          }}>EXPLANATION</span>
                          "{result.explanation}"
                        </p>
                        {result.recommendedAction && (
                          <div style={{ 
                            marginTop: '16px', 
                            padding: '12px', 
                            background: 'var(--color-primary-dim)', 
                            borderRadius: 'var(--radius-md)', 
                            borderLeft: '4px solid var(--color-primary)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', marginBottom: '6px', fontWeight: 700 }}>RECOMMENDED ACTION</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>{result.recommendedAction}</div>
                          </div>
                        )}
                      </div>
                    </GlowCard>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Row 2: Deep Analysis */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="forensic-report-section"
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <SectionLabel icon={<FileSearch size={14} />} text="FORENSIC INVESTIGATION" />
                
                <div className="module-grid-split">
                  {/* Left Column: Messaging Forensics */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Flagged Message */}
                    {text && result?.redFlags && result.redFlags.length > 0 && (
                      <GlowCard>
                        <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Send size={18} style={{ color: 'var(--color-primary)' }} /> Message Forensics
                        </h4>
                        <div
                          className="red-flag-text"
                          style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontSize: '0.85rem', 
                            lineHeight: 1.8, 
                            padding: '16px', 
                            background: 'var(--color-surface-2)', 
                            borderRadius: 'var(--radius-md)', 
                            whiteSpace: 'pre-wrap',
                            border: '1px solid var(--color-border)'
                          }}
                          dangerouslySetInnerHTML={{ __html: highlightRedFlags(text, result.redFlags) }}
                        />
                      </GlowCard>
                    )}

                    {/* Red Flags */}
                    {result.redFlags && result.redFlags.length > 0 && (
                      <GlowCard color="danger">
                        <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} /> Red Flags ({result.redFlags.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {result.redFlags.map((flag, i) => {
                            const severityStyle = getSeverityStyle(flag.severity);
                            return (
                              <motion.div
                                key={i}
                                className="job-flag-card"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ x: 4 }}
                                transition={{ delay: i * 0.08 }}
                                style={{
                                  padding: '12px',
                                  background: severityStyle.bg,
                                  borderRadius: 'var(--radius-md)',
                                  borderLeft: `3px solid ${severityStyle.border}`,
                                }}
                              >
                                <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>"{flag.phrase}"</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{flag.reason}</div>
                                <span className="badge" style={{ marginTop: '6px', ...severityStyle.badgeStyle }}>{flag.severity}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </GlowCard>
                    )}
                  </div>

                  {/* Right Column: Entity & Link Analysis */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Company Verification */}
                    {result.companyVerification && (
                      <GlowCard>
                        <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Landmark size={18} style={{ color: '#f59e0b', overflow: 'visible' }} /> Company Verification
                        </h4>
                        <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--color-muted)' }}>Company</span>
                            <span style={{ fontWeight: 600 }}>{result.companyName || 'Unknown'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-muted)' }}>MCA21 Status</span>
                            <ThreatScoreBadge level={result.companyVerification.found ? 'VERIFIED' : 'UNVERIFIED'} />
                          </div>
                          {result.companyVerification.note && (
                            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>{result.companyVerification.note}</p>
                          )}
                        </div>
                      </GlowCard>
                    )}

                    {/* Link Analysis */}
                    {result.linkAnalysis && (
                      <GlowCard color={result.linkAnalysis.hasLinks ? 'warning' : 'primary'}>
                        <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Link2 size={18} style={{ color: 'var(--color-warning)' }} /> Link Analysis
                        </h4>

                        {!result.linkAnalysis.hasLinks && (
                          <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                            No links found in this message/PDF.
                          </div>
                        )}

                        {result.linkAnalysis.hasLinks && Array.isArray(result.linkAnalysis.results) && result.linkAnalysis.results.length > 0 && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--color-muted)' }}>Overall link risk</span>
                              <span style={{ fontWeight: 600 }}>{result.linkAnalysis.overallRiskScore ?? 0}/100</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {result.linkAnalysis.results.map((item, idx) => {
                                const verdictStyle = getLinkVerdictStyle(item.verdict);
                                return (
                                  <div
                                    key={`${item.url}-${idx}`}
                                    style={{
                                      padding: '12px',
                                      background: verdictStyle.bg,
                                      borderRadius: 'var(--radius-md)',
                                      borderLeft: `3px solid ${verdictStyle.border}`,
                                    }}
                                  >
                                    <div style={{ fontWeight: 600, fontSize: '0.84rem', wordBreak: 'break-all' }}>{item.url}</div>
                                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                      <span>Domain: {item.domain || 'unknown'}</span>
                                      <span style={{ fontWeight: 700, color: verdictStyle.pillColor }}>{item.verdict?.replace('_', ' ') || 'UNRATED'}</span>
                                    </div>
                                    {Array.isArray(item.flags) && item.flags.length > 0 && (
                                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {item.flags.map((flag, flagIdx) => {
                                          const severityStyle = getSeverityStyle(flag.severity);
                                          return (
                                            <div key={`${item.url}-flag-${flagIdx}`} style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                                              <span style={{ color: severityStyle.text, fontWeight: 700 }}>{flag.severity || 'INFO'}:</span> {flag.detail}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {result.linkAnalysis.aiSummary && (
                              <div style={{ marginTop: '10px', padding: '12px', background: 'var(--color-primary-dim)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', marginBottom: '4px', fontWeight: 700 }}>AI LINK INSIGHT</div>
                                <div style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>{result.linkAnalysis.aiSummary}</div>
                              </div>
                            )}
                          </>
                        )}
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
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  );
}
