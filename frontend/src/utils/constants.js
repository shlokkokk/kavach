export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const THREAT_LEVELS = {
  HIGH: { label: 'HIGH RISK', color: 'var(--color-danger)', bg: 'var(--color-danger-dim)' },
  MEDIUM: { label: 'MEDIUM RISK', color: 'var(--color-warning)', bg: 'var(--color-warning-dim)' },
  LOW: { label: 'LOW RISK', color: 'var(--color-safe)', bg: 'var(--color-safe-dim)' },
};

export const MODULE_CONFIG = {
  audio: {
    id: 'audio',
    name: 'Deepfake Audio Detector',
    shortName: 'Voice Shield',
    description: 'Detect AI-generated voice calls and deepfake audio',
    icon: 'AudioWaveform',
    path: '/audio',
    color: '#3b82f6',
  },
  simswap: {
    id: 'simswap',
    name: 'SIM Swap Detection',
    shortName: 'SIM Guard',
    description: 'Real-time SIM swap attack monitoring and prevention',
    icon: 'Smartphone',
    path: '/simswap',
    color: '#f59e0b',
  },
  jobscanner: {
    id: 'jobscanner',
    name: 'Fake Job Offer Scanner',
    shortName: 'Job Shield',
    description: 'AI-powered fake job offer and scam message detection',
    icon: 'FileSearch',
    path: '/jobscanner',
    color: '#ef4444',
  },
};

export const ACCEPTED_AUDIO_TYPES = {
  'audio/mp3': ['.mp3'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'audio/x-m4a': ['.m4a'],
  'audio/mp4': ['.m4a'],
  'audio/webm': ['.webm'],
};

export const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB

export const SAMPLE_SCAM_MESSAGE = `Congratulations! You have been selected for Work From Home job at Reliance Digital Works Pvt Ltd.
Salary: 45,000/month. No experience required. Only 2 hours daily work.
To confirm your slot, pay ₹500 registration fee via GPay to 9876543210.
Complete onboarding now: http://bit.ly/offer-now
Salary portal verification: https://secure-login-check.xyz/payroll
Official WhatsApp Support: wa.me/919876543210
Claim your joining bonus: http://bonus-reliance-digital.top/claim
Limited seats! Apply fast. Interview waived for selected candidates.
HR Manager: Priya Sharma | hr.reliancedigitalworks@gmail.com`;

export const INDIA_FRAUD_STATS = {
  totalLoss: '₹11,333 Cr',
  dailyCases: '7,000+',
  avgLoss: '₹1.6 Lakh',
  recoveryRate: '4.5%',
};
