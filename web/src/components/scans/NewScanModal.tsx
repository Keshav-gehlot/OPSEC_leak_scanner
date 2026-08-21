import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { 
  FolderGit2, 
  FileText, 
  Sliders, 
  Play, 
  ShieldCheck, 
  Layers, 
  Cpu,
  Sparkles
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
  const [modules, setModules] = useState({
    secrets: true,
    identity: true,
    domains: true,
    metadata: true,
    infrastructure: true,
    ocr: true,
  });

  const handleToggleModule = (key: keyof typeof modules) => {
    setModules({ ...modules, [key]: !modules[key] });
  };

  const handleLaunch = () => {
    onStartScan(targetPath, scanType, scanDepth);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure New OPSEC Scan"
      subtitle="Initiate security audit across Git histories or digital artifact collections"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Target Type Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => {
              setScanType('git');
              setTargetPath('Keshav-gehlot/OPSEC_leak_scanner');
            }}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              scanType === 'git'
                ? 'border-primary bg-primary/10 shadow-glow-primary'
                : 'border-border bg-sidebar/60 hover:bg-sidebar'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${scanType === 'git' ? 'bg-primary text-white' : 'bg-sidebar text-text-muted'}`}>
                <FolderGit2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Git Repository</h4>
                <p className="text-xs text-text-muted mt-0.5">Commits, patches, author IDs, deleted files</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              setScanType('media');
              setTargetPath('e:/opsec-scanner/media_archive');
            }}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              scanType === 'media'
                ? 'border-secondary bg-secondary/10 shadow-sm'
                : 'border-border bg-sidebar/60 hover:bg-sidebar'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${scanType === 'media' ? 'bg-secondary text-white' : 'bg-sidebar text-text-muted'}`}>
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Media & Documents</h4>
                <p className="text-xs text-text-muted mt-0.5">EXIF GPS, Office metadata, images, OCR</p>
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
            className="w-full rounded-lg border border-border bg-sidebar px-4 py-2.5 text-xs font-mono text-text-primary focus:border-primary focus:outline-none"
          />
        </div>

        {/* Target Profile Selector */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-text-primary uppercase tracking-wide font-mono">Identity Profile</span>
            <span className="text-primary font-mono text-[11px]">8 active anchors</span>
          </div>
          <select className="w-full rounded-lg border border-border bg-sidebar px-4 py-2 text-xs font-medium text-text-primary focus:border-primary focus:outline-none">
            <option value="target_profile.yaml">target_profile.yaml (Keshav Gehlot — Primary)</option>
            <option value="corporate.yaml">corporate_profile.yaml (CyberSec Internal Corp)</option>
          </select>
        </div>

        {/* Scan Depth Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-primary uppercase tracking-wide font-mono block">
            Scan Depth & Forensic Level
          </label>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              { id: 'current', label: 'Current HEAD', desc: 'Working tree only' },
              { id: 'full_history', label: 'Full Git History', desc: 'All commit logs' },
              { id: 'forensic', label: 'Forensic Audit', desc: 'History + Dangling' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setScanDepth(d.id as any)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  scanDepth === d.id
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-sidebar text-text-muted hover:bg-card-hover'
                }`}
              >
                <div className="font-bold text-text-primary">{d.label}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detection Modules */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-primary uppercase tracking-wide font-mono block">
            Detection Modules
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {Object.entries(modules).map(([key, val]) => (
              <label
                key={key}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                  val ? 'border-primary/40 bg-primary/5 text-text-primary' : 'border-border bg-sidebar text-text-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={val}
                  onChange={() => handleToggleModule(key as any)}
                  className="rounded border-border bg-card text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className="capitalize font-medium text-xs">{key}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2">
          <button
            onClick={handleLaunch}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-bold shadow-glow-primary hover:opacity-95 transition-all"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>EXECUTE SCAN</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
