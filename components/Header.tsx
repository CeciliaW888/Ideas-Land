import React from "react";
import { Sparkles, Check, Copy, Settings } from "lucide-react";
import { COLORS, STYLES } from "../utils/styles";

interface HeaderProps {
  onCopy: () => void;
  onOpenSettings: () => void;
  copyFeedback: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onCopy, onOpenSettings, copyFeedback }) => {
  return (
    <header style={STYLES.header}>
      <div style={{display:'flex', alignItems:'center', gap: '8px'}}>
        <Sparkles size={20} color={COLORS.primary} />
        <h1 style={STYLES.title}>Idea Land</h1>
      </div>
      <div style={{display:'flex', gap:'4px'}}>
          <button style={STYLES.iconBtn} onClick={onCopy}>
              {copyFeedback ? <Check size={20} color={COLORS.success} /> : <Copy size={20} />}
          </button>
          <button style={STYLES.iconBtn} onClick={onOpenSettings}>
          <Settings size={20} />
          </button>
      </div>
    </header>
  );
};