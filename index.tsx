import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Modality } from "@google/genai";
import { Mic, Send, Sparkles, Settings, Save, X, Info, Loader2, Share2, Copy, Check } from "lucide-react";

// --- Constants & Styles ---

const COLORS = {
  bg: "#111111",
  card: "#1e1e1e",
  text: "#e5e5e5",
  textMuted: "#a3a3a3",
  primary: "#7c3aed", // Obsidian Purple-ish
  primaryHover: "#6d28d9",
  danger: "#ef4444",
  border: "#333333",
  success: "#22c55e",
};

const STYLES = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    padding: "0",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.card,
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: "700",
    margin: 0,
    background: "linear-gradient(to right, #c084fc, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  editorArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    padding: "16px",
    position: "relative" as const,
  },
  textarea: {
    width: "100%",
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    color: COLORS.text,
    fontSize: "1.1rem",
    lineHeight: "1.6",
    resize: "none" as const,
    outline: "none",
    fontFamily: "inherit",
  },
  toolbar: {
    padding: "12px 16px 24px 16px",
    backgroundColor: COLORS.card,
    borderTop: `1px solid ${COLORS.border}`,
    display: "flex",
    gap: "10px",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.1s ease, opacity 0.2s",
  },
  actionBtn: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    color: "#fff",
    flex: 2, // Make Send button larger
  },
  secondaryBtn: {
     backgroundColor: COLORS.card,
     color: COLORS.text,
     border: `1px solid ${COLORS.border}`,
     flex: 1,
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: COLORS.text,
    cursor: "pointer",
    padding: "8px",
  },
  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    backdropFilter: "blur(4px)",
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: "16px",
    padding: "24px",
    width: "90%",
    maxWidth: "400px",
    maxHeight: "85vh",
    overflowY: "auto" as const,
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
  },
  inputGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "0.9rem",
    color: COLORS.textMuted,
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  settingsTextarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    fontSize: "0.9rem",
    fontFamily: "monospace",
    minHeight: "100px",
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  recordingIndicator: {
    position: "absolute" as const,
    top: "20px",
    right: "20px",
    backgroundColor: COLORS.danger,
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    animation: "pulse 1.5s infinite",
  },
};

// --- Helpers ---

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read blob"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const getTimestampFilename = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}-${pad(now.getMinutes())} Idea`;
};

const getSupportedMimeType = () => {
  if (typeof MediaRecorder === "undefined") return undefined;
  
  // Prioritize webm (Chrome/Desktop), then mp4 (iOS/Safari), then others
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg"
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return undefined; // Let the browser decide default
};

// --- Main Application ---

const App = () => {
  // State
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Settings
  const [vaultName, setVaultName] = useState(() => localStorage.getItem("obsidian_vault") || "");
  const [folderPath, setFolderPath] = useState(() => {
    const saved = localStorage.getItem("obsidian_folder");
    return saved !== null ? saved : ""; 
  });
  const [template, setTemplate] = useState(() => localStorage.getItem("obsidian_template") || "{{content}}");

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingMimeTypeRef = useRef<string>("");

  // Initialize
  useEffect(() => {
    // Restore unsaved content
    const savedContent = localStorage.getItem("unsaved_idea");
    if (savedContent) setContent(savedContent);
  }, []);

  // Save content to local storage on change
  useEffect(() => {
    localStorage.setItem("unsaved_idea", content);
  }, [content]);

  // Save Settings
  const saveSettings = () => {
    localStorage.setItem("obsidian_vault", vaultName);
    localStorage.setItem("obsidian_folder", folderPath);
    localStorage.setItem("obsidian_template", template);
    setShowSettings(false);
  };

  // --- Core Functions ---

  const handleRecordToggle = async () => {
    if (isRecording) {
      // Stop Recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setIsProcessing(true);
    } else {
      // Start Recording
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
           throw new Error("Microphone access is not supported in this browser environment.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Detect supported mime type
        const supportedType = getSupportedMimeType();
        const options = supportedType ? { mimeType: supportedType } : undefined;
        
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        // Store what we tried to use, or fallback
        recordingMimeTypeRef.current = supportedType || "";

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Determine the actual mime type used
          // Some browsers populates mediaRecorder.mimeType, others don't.
          // Fallback to what we detected or a safe default for iOS (mp4) or Chrome (webm).
          const finalMimeType = mediaRecorder.mimeType || recordingMimeTypeRef.current || "audio/mp4";
          
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
          await processAudio(audioBlob, finalMimeType);
          
          stream.getTracks().forEach(track => track.stop()); // Stop mic
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone. " + (err instanceof Error ? err.message : ""));
        setIsProcessing(false);
      }
    }
  };

  const processAudio = async (audioBlob: Blob, mimeType: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Audio = await blobToBase64(audioBlob);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType, 
                data: base64Audio
              }
            },
            {
              text: "Transcribe this audio. It is a user jotting down a quick note or idea. Transcribe exactly what is said, but fix minor stutters."
            }
          ]
        }
      });

      const transcription = response.text || "";
      setContent((prev) => prev + (prev ? "\n\n" : "") + transcription);
    } catch (error) {
      console.error("Transcription failed", error);
      alert("Transcription failed. Please try again. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMagicPolish = async () => {
    if (!content.trim()) return;
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `You are an expert personal knowledge management assistant. 
        Refine the following raw note into a clean, concise Markdown format.
        - Fix grammar and spelling.
        - If it looks like a task, format it as a checklist item.
        - Add a relevant #tag at the end based on the context.
        - Keep the tone personal.
        
        Raw Note:
        ${content}`,
      });

      if (response.text) {
        setContent(response.text);
      }
    } catch (error) {
      console.error("Polish failed", error);
      alert("Could not polish text. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsProcessing(false);
    }
  };

  const applyTemplate = (rawContent: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5); // HH:MM

    // Default to just content if template is somehow empty
    let tmpl = template || "{{content}}";
    
    return tmpl
      .replace(/{{content}}/g, rawContent)
      .replace(/{{date}}/g, dateStr)
      .replace(/{{time}}/g, timeStr);
  };

  const handleSendToObsidian = () => {
    if (!vaultName) {
      alert("Please configure your Obsidian Vault Name in settings first.");
      setShowSettings(true);
      return;
    }
    if (!content.trim()) {
      alert("Write something first!");
      return;
    }

    const filename = getTimestampFilename();
    const encodedVault = encodeURIComponent(vaultName);
    
    // Construct file path: trim slash logic to ensure clean paths
    const cleanFolder = folderPath.trim().replace(/\/$/, ""); 
    const fullPath = cleanFolder ? `${cleanFolder}/${filename}` : filename;
    const encodedFile = encodeURIComponent(fullPath);
    
    // Apply template before encoding
    const finalContent = applyTemplate(content);
    const encodedContent = encodeURIComponent(finalContent);

    // Construct Obsidian URI
    const uri = `obsidian://new?vault=${encodedVault}&file=${encodedFile}&content=${encodedContent}`;

    // On iOS, a simulated click often works better for deep links
    const link = document.createElement('a');
    link.href = uri;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    // Apply template for sharing (assuming "Export to..." use case)
    const finalContent = applyTemplate(content);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Idea from Idea Land',
          text: finalContent,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      // Fallback to copying raw content if share not supported (unlikely on modern mobile)
      handleCopy();
    }
  };

  const handleCopy = async () => {
    // For copy, we usually want the raw text to paste anywhere, 
    // but if the user relies on templates for everything, this is debatable.
    // For now, let's keep Copy as "Raw Content" for quick extraction.
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div style={STYLES.container}>
      {/* Header */}
      <header style={STYLES.header}>
        <div style={{display:'flex', alignItems:'center', gap: '8px'}}>
          <Sparkles size={20} color={COLORS.primary} />
          <h1 style={STYLES.title}>Idea Land</h1>
        </div>
        <div style={{display:'flex', gap:'4px'}}>
            <button style={STYLES.iconBtn} onClick={handleCopy}>
                {copyFeedback ? <Check size={20} color={COLORS.success} /> : <Copy size={20} />}
            </button>
            <button style={STYLES.iconBtn} onClick={() => setShowSettings(true)}>
            <Settings size={20} />
            </button>
        </div>
      </header>

      {/* Main Editor */}
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

      {/* Toolbar */}
      <div style={STYLES.toolbar}>
        <button 
          style={{...STYLES.button, ...STYLES.actionBtn, flex: 0, minWidth: '50px'}}
          onClick={handleRecordToggle}
          disabled={isProcessing}
        >
          {isRecording ? <div style={{width: 16, height: 16, background: COLORS.danger, borderRadius: 2}} /> : <Mic size={20} />}
        </button>

        {!isRecording && (
          <>
             <button 
              style={{...STYLES.button, ...STYLES.secondaryBtn, flex: 1}}
              onClick={handleMagicPolish}
              disabled={isProcessing || !content.trim()}
            >
              <Sparkles size={18} color={COLORS.primary} />
              Polish
            </button>

            {canShare ? (
                <button 
                style={{...STYLES.button, ...STYLES.secondaryBtn, flex: 0, padding: '12px'}}
                onClick={handleShare}
                disabled={isProcessing || !content.trim()}
                title="Share"
                >
                <Share2 size={18} />
                </button>
            ) : null}

            <button 
              style={{...STYLES.button, ...STYLES.primaryBtn}}
              onClick={handleSendToObsidian}
              disabled={isProcessing}
              title="Save to Obsidian Vault"
            >
              <Send size={18} />
              Obsidian
            </button>
          </>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={STYLES.modalOverlay}>
          <div style={STYLES.modal}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, fontSize: '1.2rem'}}>Settings</h2>
              <button style={STYLES.iconBtn} onClick={() => setShowSettings(false)}>
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
              <label style={STYLES.label}>Note Template</label>
              <textarea 
                style={STYLES.settingsTextarea} 
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Type your template here..."
              />
               <div style={{fontSize: '0.8rem', color: COLORS.textMuted, marginTop: '4px', lineHeight: '1.4'}}>
                Use <code>{`{{content}}`}</code> for your note.<br/>
                Use <code>{`{{date}}`}</code> and <code>{`{{time}}`}</code> for timestamps.<br/>
                Example:<br/>
                <pre style={{background: '#333', padding: '4px', borderRadius: '4px', margin: '4px 0'}}>
---
created: {`{{date}}`} {`{{time}}`}
---
{`{{content}}`}
                </pre>
              </div>
            </div>

            <button 
              style={{...STYLES.button, ...STYLES.primaryBtn, width: '100%', marginTop: '16px'}} 
              onClick={saveSettings}
            >
              <Save size={18} />
              Save Settings
            </button>
          </div>
        </div>
      )}
      
      {/* Global Styles for Animations */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);