import React from "react";
import { Loader2 } from "lucide-react";
import { COLORS, STYLES } from "../utils/styles";

interface EditorProps {
  content: string;
  setContent: (val: string) => void;
  isRecording: boolean;
  isProcessing: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const Editor: React.FC<EditorProps> = ({ content, setContent, isRecording, isProcessing, textareaRef }) => {
  return (
    <div style={STYLES.editorArea}>
      <textarea
        ref={textareaRef}
        style={STYLES.textarea}
        placeholder="Jot down a fleeting thought..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
      />
      
      {isRecording && (
        <div style={STYLES.recordingIndicator}>
          <div style={{width: 8, height: 8, background: 'white', borderRadius: '50%'}} />
          Recording...
        </div>
      )}

      {isProcessing && (
        <div style={{
          position: 'absolute', 
          bottom: 20, 
          left: '50%', 
          transform: 'translateX(-50%)',
          background: COLORS.card,
          padding: '8px 16px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          fontSize: '0.9rem'
        }}>
          <Loader2 className="animate-spin" size={16} />
          Thinking...
        </div>
      )}
    </div>
  );
};