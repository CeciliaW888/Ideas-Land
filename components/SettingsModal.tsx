import React, { useState } from "react";
import { X, Info, Check, Save } from "lucide-react";
import { COLORS, STYLES } from "../utils/styles";

interface Settings {
  vaultName: string;
  folderPath: string;
  fileNameTemplate: string;
  template: string;
}

interface SettingsModalProps {
  onClose: () => void;
  onSave: (settings: Settings) => void;
  currentSettings: Settings;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onSave,
  currentSettings
}) => {
  // Initialize local state from current settings
  // This ensures we don't apply changes until the user clicks "Save"
  const [vaultName, setVaultName] = useState(currentSettings.vaultName);
  const [folderPath, setFolderPath] = useState(currentSettings.folderPath);
  const [fileNameTemplate, setFileNameTemplate] = useState(currentSettings.fileNameTemplate);
  const [template, setTemplate] = useState(currentSettings.template);

  const handleSave = () => {
    // Trim inputs to avoid "Vault Not Found" errors caused by trailing spaces
    onSave({
      vaultName: vaultName.trim(),
      folderPath: folderPath.trim(),
      fileNameTemplate: fileNameTemplate.trim(),
      template: template // Keep template as-is to preserve intentional spacing/newlines
    });
  };

  return (
    <div style={STYLES.modalOverlay}>
      <div style={STYLES.modal}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
          <h2 style={{margin: 0, fontSize: '1.2rem'}}>Settings</h2>
          <button style={STYLES.iconBtn} onClick={onClose} title="Cancel">
            <X size={20} />
          </button>
        </div>
        
        <div style={STYLES.inputGroup}>
          <label style={STYLES.label}>Obsidian Vault Name (Required)</label>
          <input 
            style={STYLES.input} 
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
            placeholder="e.g., MyKnowledgeBase"
          />
          <div style={{fontSize: '0.8rem', color: COLORS.textMuted, marginTop: '4px', display:'flex', gap: '4px'}}>
            <Info size={12} style={{marginTop: 2}}/>
            Required for direct "Obsidian" button. Case-sensitive.
          </div>
        </div>

        <div style={STYLES.inputGroup}>
          <label style={STYLES.label}>Inbox Folder Path (Optional)</label>
          <input 
            style={STYLES.input} 
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="e.g., Inbox (Leave empty for root)"
          />
           <div style={{fontSize: '0.8rem', color: COLORS.textMuted, marginTop: '4px', display:'flex', gap: '4px'}}>
            <Info size={12} style={{marginTop: 2}}/>
            Leave blank to save to the root of your vault.
          </div>
        </div>

        <div style={STYLES.inputGroup}>
          <label style={STYLES.label}>File Name Template</label>
          <input 
            style={STYLES.input} 
            value={fileNameTemplate}
            onChange={(e) => setFileNameTemplate(e.target.value)}
            placeholder="{{date}} {{time}} Idea"
          />
           <div style={{fontSize: '0.8rem', color: COLORS.textMuted, marginTop: '4px', display:'flex', gap: '4px', flexWrap: 'wrap', lineHeight: '1.4'}}>
            <Info size={12} style={{marginTop: 2}}/>
            {`{{date}}`}, {`{{time}}`}, {`{{year}}`}, {`{{month}}`}, {`{{day}}`}, {`{{hour}}`}, {`{{minute}}`}, {`{{second}}`}.
            Colons in time will be replaced by dashes in filenames.
          </div>
        </div>

        <div style={STYLES.inputGroup}>
          <label style={STYLES.label}>Note Template</label>
          <textarea 
            style={STYLES.settingsTextarea} 
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="Type your template here..."
          />
           <div style={{fontSize: '0.8rem', color: COLORS.textMuted, marginTop: '4px', lineHeight: '1.4'}}>
            Use <code>{`{{content}}`}</code> for your note.<br/>
            Example:<br/>
            <pre style={{background: '#333', padding: '4px', borderRadius: '4px', margin: '4px 0'}}>
---
created: {`{{date}}`} {`{{time}}`}
---
{`{{content}}`}
            </pre>
          </div>
        </div>

        <div style={{display: 'flex', gap: '10px', marginTop: '16px'}}>
            <button 
            style={{...STYLES.button, ...STYLES.secondaryBtn}} 
            onClick={onClose}
            >
            Cancel
            </button>
            <button 
            style={{...STYLES.button, ...STYLES.primaryBtn}} 
            onClick={handleSave}
            >
            <Save size={18} />
            Save & Close
            </button>
        </div>
      </div>
    </div>
  );
};