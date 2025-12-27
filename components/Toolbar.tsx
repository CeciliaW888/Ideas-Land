import React from "react";
import { Mic, Sparkles, Eraser, Send } from "lucide-react";
import { COLORS, STYLES } from "../utils/styles";

interface ToolbarProps {
  isRecording: boolean;
  isProcessing: boolean;
  content: string;
  onRecordToggle: () => void;
  onMagicPolish: () => void;
  onClear: () => void;
  onSendToObsidian: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isRecording,
  isProcessing,
  content,
  onRecordToggle,
  onMagicPolish,
  onClear,
  onSendToObsidian
}) => {
  return (
    <div style={STYLES.toolbar}>
      <button 
        style={{...STYLES.button, ...STYLES.actionBtn, flex: 0, minWidth: '50px'}}
        onClick={onRecordToggle}
        disabled={isProcessing}
      >
        {isRecording ? <div style={{width: 16, height: 16, background: COLORS.danger, borderRadius: 2}} /> : <Mic size={20} />}
      </button>

      {!isRecording && (
        <>
           <button 
            style={{...STYLES.button, ...STYLES.secondaryBtn, flex: 1}}
            onClick={onMagicPolish}
            disabled={isProcessing || !content.trim()}
          >
            <Sparkles size={18} color={COLORS.primary} />
            Polish
          </button>

          <button 
            style={{...STYLES.button, ...STYLES.secondaryBtn, flex: 0, padding: '12px'}}
            onClick={onClear}
            disabled={isProcessing || !content.trim()}
            title="Clear Content"
          >
            <Eraser size={18} />
          </button>

          <button 
            style={{...STYLES.button, ...STYLES.primaryBtn}}
            onClick={onSendToObsidian}
            disabled={isProcessing}
            title="Save to Obsidian Vault"
          >
            <Send size={18} />
            Obsidian
          </button>
        </>
      )}
    </div>
  );
};