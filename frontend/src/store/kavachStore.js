import { create } from 'zustand';

const useKavachStore = create((set, get) => ({
  // Global state
  sidebarOpen: true,
  activeModule: null,
  
  // Scan history
  scanHistory: [],
  
  // Dashboard stats
  stats: {
    totalScans: 0,
    threatsDetected: 0,
    scamsBlocked: 0,
    moneySaved: 0,
  },
  
  // Audio module state
  audioResult: null,
  audioLoading: false,
  
  // SIM swap module state
  simRegistered: false,
  simPhoneNumber: '',
  simEvents: [],
  simRiskScore: 0,
  simAlerts: [],
  simFrozen: false,
  simCarrierData: null,
  
  // Job scanner module state
  jobResult: null,
  jobLoading: false,
  
  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveModule: (mod) => set({ activeModule: mod }),
  
  // Add scan to history
  addScan: (scan) => set((state) => {
    const newHistory = [scan, ...state.scanHistory].slice(0, 50);
    const isThreat = scan.threatLevel === 'HIGH' || scan.threatLevel === 'MEDIUM';
    return {
      scanHistory: newHistory,
      stats: {
        ...state.stats,
        totalScans: state.stats.totalScans + 1,
        threatsDetected: state.stats.threatsDetected + (isThreat ? 1 : 0),
        scamsBlocked: state.stats.scamsBlocked + (scan.threatLevel === 'HIGH' ? 1 : 0),
        moneySaved: state.stats.moneySaved + (isThreat ? Math.floor(Math.random() * 50000 + 10000) : 0),
      },
    };
  }),
  
  // Audio actions
  setAudioResult: (result) => set({ audioResult: result }),
  setAudioLoading: (loading) => set({ audioLoading: loading }),
  
  // SIM swap actions
  registerSim: (phoneNumber) => set({ simRegistered: true, simPhoneNumber: phoneNumber, simEvents: [], simRiskScore: 0, simAlerts: [], simFrozen: false }),
  addSimEvent: (event) => set((state) => ({
    simEvents: [event, ...state.simEvents].slice(0, 100),
    simRiskScore: event.riskScore ?? state.simRiskScore,
  })),
  addSimAlert: (alert) => set((state) => ({
    simAlerts: [alert, ...state.simAlerts],
  })),
  setSimRiskScore: (score) => set({ simRiskScore: score }),
  setSimCarrierData: (data) => set({ simCarrierData: data }),
  freezeTransactions: () => set({ simFrozen: true }),
  unfreezeSim: () => set({ simFrozen: false, simAlerts: [] }),
  resetSim: () => set({ simRegistered: false, simPhoneNumber: '', simEvents: [], simRiskScore: 0, simAlerts: [], simFrozen: false }),
  
  // Job scanner actions
  setJobResult: (result) => set({ jobResult: result }),
  setJobLoading: (loading) => set({ jobLoading: loading }),
}));

export default useKavachStore;
