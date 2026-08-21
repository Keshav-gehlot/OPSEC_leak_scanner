import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { 
  FolderGit2, 
  FileText, 
  Play, 
  ShieldCheck, 
  Layers, 
  Cpu,
  Binary,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface NewScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: (target: string, type: 'git' | 'media', depth: 'current' | 'full_history' | 'forensic') => void;
}

export const NewScanModal: React.FC<NewScanModalProps> = ({
  isOpen,
  onClose,
  onStartScan,
}) => {
  const [scanType, setScanType] = useState<'git' | 'media'>('git');
  const [targetPath, setTargetPath] = useState('Keshav-gehlot/OPSEC_leak_scanner');
  const [scanDepth, setScanDepth] = useState<'current' | 'full_history' | 'forensic'>('forensic');
  const [showAdvanced, setShowAdvanced] = useState(true);

  const [modules, setModules] = useState({
    credentials: true,
    identity: true,
    domains: true,
    infrastructure: true,
    metadata: true,
    ocr: true,
    entropy: true,
    risk_analysis: true,
  });

  const [outputs, setOutputs] = useState({
    html: true,
    json: true,
    pdf: true,
    sarif: true,
  });

  const handleToggleModule = (key: keyof typeof modules) => {
    setModules({ ...modules, [key]: !modules[key] });
  };

  const handleToggleOutput = (key: keyof typeof outputs) => {
    setOutputs({ ...outputs, [key]: !outputs[key] });
  };

  const handleLaunch = () => {
    onStartScan(targetPath, scanType, scanDepth);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New OPSEC Scan"
      subtitle="Analyze a repository or digital artifact set for operational-security exposure"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Two Large Selectable Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => {
              setScanType('git');
              setTargetPath('Keshav-gehlot/OPSEC_leak_scanner');
            }}
            className={`cursor-pointer rounded-2xl border p-5 transition-all ${
              scanType === 'git'
                ? 'border-primary bg-primary/10 shadow-glow-primary'
                : 'border-border bg-surface-elevated/60 hover:bg-surface-elevated'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-xl ${scanType === 'git' ? 'bg-primary text-white' : 'bg-sidebar text-text-muted'}`}>
                <FolderGit2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Git Repository</h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Analyze Git history, commits, branches, deleted content, identity evidence and historical secrets.
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              setScanType('media');
              setTargetPath('e:/opsec-scanner/media_archive');
            }}
            className={`cursor-pointer rounded-2xl border p-5 transition-all ${
              scanType === 'media'
                ? 'border-secondary bg-secondary/10 shadow-sm'
                : 'border-border bg-surface-elevated/60 hover:bg-surface-elevated'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-xl ${scanType === 'media' ? 'bg-secondary text-white' : 'bg-sidebar text-text-muted'}`}>
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Media & Documents</h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Analyze images, PDFs, Office documents, metadata, EXIF GPS and OCR content.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Target Path Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-primary uppercase tracking-wide font-mono">
            {scanType === 'git' ? 'Repository Path or Clone Target' : 'Directory Path'}
          </label>
          <input
            type="text"
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
            placeholder={scanType === 'git' ? 'e.g. /path/to/repo or owner/repo' : 'e.g. /path/to/documents'}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-mono text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        {/* Target Profile Selection */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-text-primary uppercase tracking-wide font-mono">Target Profile</span>
            <span className="text-primary font-mono text-[11px]">8 active anchors</span>
          </div>
          <select className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-xs font-medium text-text-primary focus:border-primary focus:outline-none font-mono">
            <option value="target_profile.yaml">target_profile.yaml (Keshav Gehlot — Primary Target)</option>
            <option value="corporate.yaml">corporate_profile.yaml (CyberSec Internal Corp)</option>
          </select>
        </div>

        {/* Scan Depth Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-primary uppercase tracking-wide font-mono block">
            Scan Depth
          </label>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              { id: 'current', label: 'Current Files', desc: 'Working tree only' },
              { id: 'full_history', label: 'Full Git History', desc: 'All commit logs' },
              { id: 'forensic', label: 'Forensic Analysis', desc: 'History + Dangling' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setScanDepth(d.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scanDepth === d.id
                    ? 'border-primary bg-primary/10 text-primary font-semibold shadow-glow-primary'
                    : 'border-border bg-surface text-text-muted hover:bg-surface-elevated'
                }`}
              >
                <div className="font-bold text-text-primary">{d.label}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Detection Modules Panel */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-xs font-mono font-bold text-text-secondary hover:text-text-primary"
          >
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <span>DETECTION MODULES & OUTPUT FORMATS</span>
            </div>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-border/60 animate-fade-in">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-text-muted block">Active Modules</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(modules).map(([key, val]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                        val ? 'border-primary/40 bg-primary/10 text-text-primary' : 'border-border bg-sidebar text-text-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={() => handleToggleModule(key as any)}
                        className="rounded border-border bg-card text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="capitalize font-mono text-[11px] truncate">{key.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-text-muted block">Output Formats</span>
                <div className="flex items-center gap-3 text-xs">
                  {Object.entries(outputs).map(([key, val]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer select-none ${
                        val ? 'border-secondary/40 bg-secondary/10 text-text-primary font-bold' : 'border-border bg-sidebar text-text-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={() => handleToggleOutput(key as any)}
                        className="rounded border-border bg-card text-secondary focus:ring-secondary h-3 w-3"
                      />
                      <span className="uppercase font-mono text-[11px]">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        <div className="pt-2">
          <button
            onClick={handleLaunch}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-extrabold tracking-wider shadow-glow-primary hover:opacity-95 transition-all"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>START SCAN</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
