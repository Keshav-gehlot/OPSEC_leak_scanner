import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { PageId } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Scans } from './pages/Scans';
import { Findings } from './pages/Findings';
import { IdentityGraph } from './pages/IdentityGraph';
import { GitForensics } from './pages/GitForensics';
import { Baseline } from './pages/Baseline';
import { Intelligence } from './pages/Intelligence';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

import { FindingDetailModal } from './components/findings/FindingDetailModal';
import { NewScanModal } from './components/scans/NewScanModal';
import { CommandPalette } from './components/common/CommandPalette';
import { ToastContainer, ToastMessage } from './components/common/Toast';

import { 
  Finding, 
  Scan, 
  IdentityGraphNode, 
  IdentityGraphEdge, 
  GitForensicFinding, 
  BaselineComparison, 
  DomainIntelligence, 
  ReportItem, 
  TargetProfile,
  FindingStatus
} from './types';

import { fetchFindings, updateFindingStatus } from './api/findings';
import { fetchScans, createScan } from './api/scans';
import { fetchIdentityGraph, fetchTargetProfile, saveTargetProfile } from './api/identity';
import { fetchGitForensics } from './api/git';
import { fetchBaselineComparison, updateBaselineSnapshot } from './api/baseline';
import { fetchDomainIntelligence } from './api/intelligence';
import { fetchReports, triggerReportGeneration } from './api/reports';
import { mockTargetProfile } from './api/mockData';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  // Data states
  const [findings, setFindings] = useState<Finding[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  const [identityNodes, setIdentityNodes] = useState<IdentityGraphNode[]>([]);
  const [identityEdges, setIdentityEdges] = useState<IdentityGraphEdge[]>([]);
  const [gitForensics, setGitForensics] = useState<GitForensicFinding[]>([]);
  const [baseline, setBaseline] = useState<BaselineComparison | null>(null);
  const [domains, setDomains] = useState<DomainIntelligence[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [profile, setProfile] = useState<TargetProfile>(mockTargetProfile);

  // Modals & Palettes
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isNewScanModalOpen, setIsNewScanModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load
  useEffect(() => {
    fetchFindings().then(setFindings);
    fetchScans().then(setScans);
    fetchIdentityGraph().then((res) => {
      setIdentityNodes(res.nodes);
      setIdentityEdges(res.edges);
    });
    fetchGitForensics().then(setGitForensics);
    fetchBaselineComparison().then(setBaseline);
    fetchDomainIntelligence().then(setDomains);
    fetchReports().then(setReports);
    fetchTargetProfile().then(setProfile);
  }, []);

  // Keyboard shortcut for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleStatusChange = async (id: string, newStatus: FindingStatus) => {
    const updated = await updateFindingStatus(id, newStatus);
    if (updated) {
      setFindings((prev) => prev.map((f) => (f.id === id ? updated : f)));
      if (selectedFinding?.id === id) {
        setSelectedFinding(updated);
      }
      addToast('success', `Finding status updated to ${newStatus}`, updated.title);
    }
  };

  const handleBulkStatusChange = (ids: string[], newStatus: FindingStatus) => {
    setFindings((prev) =>
      prev.map((f) => (ids.includes(f.id) ? { ...f, status: newStatus } : f))
    );
    addToast('success', `Updated ${ids.length} findings to ${newStatus}`);
  };

  const handleStartScan = async (
    target: string,
    type: 'git' | 'media',
    depth: 'current' | 'full_history' | 'forensic'
  ) => {
    const newScan = await createScan(target, type, depth);
    setActiveScan(newScan);
    setScans((prev) => [newScan, ...prev]);
    setActivePage('scans');
    addToast('info', 'OPSEC Scan Initiated', `Analyzing ${target}...`);
  };

  const handleUpdateBaseline = async () => {
    await updateBaselineSnapshot();
    const fresh = await fetchBaselineComparison();
    setBaseline(fresh);
    addToast('success', 'Baseline Synchronized', 'Active findings snapshot saved as new baseline reference.');
  };

  const handleGenerateReport = async (format: 'HTML' | 'PDF' | 'JSON' | 'SARIF') => {
    const item = await triggerReportGeneration(format);
    setReports((prev) => [item, ...prev]);
    addToast('success', `${format} Report Generated`, item.title);
  };

  const handleExportQuick = (format: 'JSON' | 'SARIF' | 'PDF' | 'HTML') => {
    handleGenerateReport(format);
    setActivePage('reports');
  };

  const handleSaveProfile = async (p: TargetProfile) => {
    await saveTargetProfile(p);
    setProfile(p);
    addToast('success', 'Target Profile Saved', `${p.name} profile anchors updated.`);
  };

  return (
    <AppLayout
      activePage={activePage}
      onSelectPage={setActivePage}
      onStartNewScan={() => setIsNewScanModalOpen(true)}
      onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      openFindingsCount={findings.filter((f) => f.status === 'OPEN').length}
    >
      {/* Page Routing */}
      {activePage === 'dashboard' && (
        <Dashboard
          findings={findings}
          onSelectFinding={setSelectedFinding}
          onNavigatePage={(page) => setActivePage(page)}
          onStartNewScan={() => setIsNewScanModalOpen(true)}
        />
      )}

      {activePage === 'scans' && (
        <Scans
          scans={scans}
          activeScan={activeScan}
          onStartNewScan={() => setIsNewScanModalOpen(true)}
          onViewFindings={() => setActivePage('findings')}
          onViewIdentity={() => setActivePage('identity')}
          onGenerateReport={() => handleGenerateReport('HTML')}
        />
      )}

      {activePage === 'findings' && (
        <Findings
          findings={findings}
          onSelectFinding={setSelectedFinding}
          onExport={handleExportQuick}
          onBulkStatusChange={handleBulkStatusChange}
        />
      )}

      {activePage === 'identity' && (
        <IdentityGraph nodes={identityNodes} edges={identityEdges} />
      )}

      {activePage === 'git-forensics' && (
        <GitForensics forensics={gitForensics} />
      )}

      {activePage === 'baseline' && baseline && (
        <Baseline
          baseline={baseline}
          onSelectFinding={setSelectedFinding}
          onUpdateBaseline={handleUpdateBaseline}
          onExportDiff={() => handleGenerateReport('JSON')}
        />
      )}

      {activePage === 'intelligence' && (
        <Intelligence domains={domains} />
      )}

      {activePage === 'reports' && (
        <Reports reports={reports} onGenerateReport={handleGenerateReport} />
      )}

      {activePage === 'settings' && (
        <Settings profile={profile} onSaveProfile={handleSaveProfile} />
      )}

      {/* Global Modals & Command Palette */}
      <FindingDetailModal
        finding={selectedFinding}
        isOpen={Boolean(selectedFinding)}
        onClose={() => setSelectedFinding(null)}
        onStatusChange={handleStatusChange}
      />

      <NewScanModal
        isOpen={isNewScanModalOpen}
        onClose={() => setIsNewScanModalOpen(false)}
        onStartScan={handleStartScan}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectPage={setActivePage}
        onSelectFinding={(f) => setSelectedFinding(f)}
        onStartNewScan={() => setIsNewScanModalOpen(true)}
        findings={findings}
      />

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </AppLayout>
  );
};
export default App;
