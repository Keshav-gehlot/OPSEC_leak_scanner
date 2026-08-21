import React, { useState } from 'react';
import { TargetProfile } from '../types';
import { 
  User, 
  Sliders, 
  ShieldCheck, 
  Save, 
  Check,
  Plus,
  Trash2,
  Lock,
  Binary,
  Layers,
  Sparkles
} from 'lucide-react';

interface SettingsProps {
  profile: TargetProfile;
  onSaveProfile: (profile: TargetProfile) => void;
}

export const Settings: React.FC<SettingsProps> = ({ profile, onSaveProfile }) => {
  const [formData, setFormData] = useState<TargetProfile>(profile);
  const [entropyThreshold, setEntropyThreshold] = useState(3.5);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [metadataEnabled, setMetadataEnabled] = useState(true);
  const [domainIntelEnabled, setDomainIntelEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  // Suppressions list state
  const [suppressions, setSuppressions] = useState<string[]>([
    'ruleId:example_token_pattern (docs/testing.md)',
    'ruleId:test_database_uri (tests/fixtures/db.sqlite)',
    'domain:localhost (local development)',
  ]);
  const [newSuppression, setNewSuppression] = useState('');

  const handleSave = () => {
    onSaveProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddSuppression = () => {
    if (newSuppression.trim()) {
      setSuppressions([...suppressions, newSuppression.trim()]);
      setNewSuppression('');
    }
  };

  const handleRemoveSuppression = (idx: number) => {
    setSuppressions(suppressions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
            Settings & Detection Rules
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            Configure target identity anchors, detection sensitivity, entropy thresholds, and false-positive suppressions.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-bold shadow-glow-primary hover:opacity-95 transition-all"
        >
          {saved ? <Check className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
          <span>{saved ? 'SETTINGS SAVED' : 'SAVE CONFIGURATION'}</span>
        </button>
      </div>

      {/* Target Identity Profile Section */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-6">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <User className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-text-primary">Target Identity Profile Anchors</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-text-primary block uppercase font-mono text-[10px] mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-border bg-sidebar px-4 py-2 text-xs text-text-primary focus:border-primary focus:outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-text-primary block uppercase font-mono text-[10px] mb-1">
                Known Emails (comma-separated)
              </label>
              <textarea
                rows={2}
                value={formData.emails.join(', ')}
                onChange={(e) =>
                  setFormData({ ...formData, emails: e.target.value.split(',').map((s) => s.trim()) })
                }
                className="w-full rounded-xl border border-border bg-sidebar p-3 text-xs text-text-primary focus:border-primary focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-text-primary block uppercase font-mono text-[10px] mb-1">
                Internal Domains & Suffixes
              </label>
              <textarea
                rows={2}
                value={formData.domains.join(', ')}
                onChange={(e) =>
                  setFormData({ ...formData, domains: e.target.value.split(',').map((s) => s.trim()) })
                }
                className="w-full rounded-xl border border-border bg-sidebar p-3 text-xs text-text-primary focus:border-primary focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-text-primary block uppercase font-mono text-[10px] mb-1">
                GitHub / Developer Handles
              </label>
              <input
                type="text"
                value={formData.githubHandles.join(', ')}
                onChange={(e) =>
                  setFormData({ ...formData, githubHandles: e.target.value.split(',').map((s) => s.trim()) })
                }
                className="w-full rounded-xl border border-border bg-sidebar px-4 py-2 text-xs text-text-primary focus:border-primary focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-text-primary block uppercase font-mono text-[10px] mb-1">
                Target Hostnames & Workstations
              </label>
              <input
                type="text"
                value={formData.hostnames.join(', ')}
                onChange={(e) =>
                  setFormData({ ...formData, hostnames: e.target.value.split(',').map((s) => s.trim()) })
                }
                className="w-full rounded-xl border border-border bg-sidebar px-4 py-2 text-xs text-text-primary focus:border-primary focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-text-primary block uppercase font-mono text-[10px] mb-1">
              Home / Office GPS Coordinates (Lat, Lon)
            </label>
            <input
              type="text"
              value={formData.homeCoordinates ? formData.homeCoordinates.join(', ') : ''}
              onChange={(e) => {
                const parts = e.target.value.split(',').map((s) => parseFloat(s.trim()));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  setFormData({ ...formData, homeCoordinates: [parts[0], parts[1]] });
                }
              }}
              placeholder="e.g. 26.2389, 73.0243"
              className="w-full rounded-xl border border-border bg-sidebar px-4 py-2 text-xs text-text-primary focus:border-primary focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Detection Configuration */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-6">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <Sliders className="h-5 w-5 text-secondary" />
          <h3 className="text-base font-bold text-text-primary">Detection Sensitivity & Thresholds</h3>
        </div>

        <div className="space-y-5 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-text-primary">Shannon Entropy Threshold</span>
              <span className="font-mono font-bold text-secondary">{entropyThreshold.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="5.0"
              step="0.1"
              value={entropyThreshold}
              onChange={(e) => setEntropyThreshold(parseFloat(e.target.value))}
              className="w-full accent-secondary"
            />
            <span className="text-[11px] text-text-muted">Higher values filter low-randomness dictionary strings.</span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-text-primary">Identity Correlation Confidence Threshold</span>
              <span className="font-mono font-bold text-primary">{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              step="1"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="pt-2 border-t border-border/60 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-semibold text-text-primary">OCR Image Normalization</p>
                <p className="text-[11px] text-text-muted">Enable OCR character confusion correction (O ↔ 0, I ↔ 1, S ↔ 5)</p>
              </div>
              <input
                type="checkbox"
                checked={ocrEnabled}
                onChange={() => setOcrEnabled(!ocrEnabled)}
                className="h-4 w-4 rounded text-primary focus:ring-primary border-border bg-card"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-semibold text-text-primary">Document Metadata Extraction</p>
                <p className="text-[11px] text-text-muted">Extract EXIF GPS, PDF authors, and Office software traces</p>
              </div>
              <input
                type="checkbox"
                checked={metadataEnabled}
                onChange={() => setMetadataEnabled(!metadataEnabled)}
                className="h-4 w-4 rounded text-primary focus:ring-primary border-border bg-card"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-semibold text-text-primary">Domain Intelligence Classification</p>
                <p className="text-[11px] text-text-muted">Classify VPN gateways, monitoring dashboards, and internal routes</p>
              </div>
              <input
                type="checkbox"
                checked={domainIntelEnabled}
                onChange={() => setDomainIntelEnabled(!domainIntelEnabled)}
                className="h-4 w-4 rounded text-primary focus:ring-primary border-border bg-card"
              />
            </label>
          </div>
        </div>
      </div>

      {/* False-Positive Suppressions Manager */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <ShieldCheck className="h-5 w-5 text-low" />
          <h3 className="text-base font-bold text-text-primary">False-Positive Suppressions</h3>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSuppression}
              onChange={(e) => setNewSuppression(e.target.value)}
              placeholder="e.g. ruleId:pattern_name or path/to/file.py"
              className="flex-1 rounded-xl border border-border bg-sidebar px-4 py-2 text-xs text-text-primary focus:border-primary focus:outline-none font-mono"
            />
            <button
              onClick={handleAddSuppression}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-card-hover border border-border text-xs font-semibold text-text-primary"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>

          <div className="rounded-xl border border-border bg-sidebar/70 divide-y divide-border/60">
            {suppressions.map((supp, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary">{supp}</span>
                <button
                  onClick={() => handleRemoveSuppression(idx)}
                  className="text-text-muted hover:text-critical p-1 rounded transition-colors"
                  title="Remove suppression"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
