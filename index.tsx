import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

import { Header } from "./components/Header";
import { Editor } from "./components/Editor";
import { Toolbar } from "./components/Toolbar";
import { SettingsModal } from "./components/SettingsModal";
import { Toast, ToastType } from "./components/Toast";
import { STYLES, COLORS } from "./utils/styles";
import { blobToBase64, getSupportedMimeType, formatWithTokens } from "./utils/helpers";

// --- Main Application ---

const App = () => {
  // State
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
  
  // Settings - Initialize from LocalStorage or Defaults
  const [vaultName, setVaultName] = useState(() => localStorage.getItem("obsidian_vault") || "");
  const [folderPath, setFolderPath] = useState(() => {
    const saved = localStorage.getItem("obsidian_folder");
    return saved !== null ? saved : ""; 
  });
  const [fileNameTemplate, setFileNameTemplate] = useState(() => localStorage.getItem("obsidian_filename") || "{{date}} {{time}} Idea");
  const [template, setTemplate] = useState(() => localStorage.getItem("obsidian_template") || "{{content}}");
  
  // NEW: Transcription settings
  const [useBrowserFallback, setUseBrowserFallback] = useState(() => 
    localStorage.getItem("use_browser_fallback") !== "false"
  );
  const [browserLanguage, setBrowserLanguage] = useState(() => 
    localStorage.getItem("browser_language") || "zh-CN"
  );

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingMimeTypeRef = useRef<string>("");
  const recognitionRef = useRef<any>(null);

  // Initialize Content
  useEffect(() => {
    const savedContent = localStorage.getItem("unsaved_idea");
    if (savedContent) setContent(savedContent);
  }, []);

  // Save content to local storage on change
  useEffect(() => {
    localStorage.setItem("unsaved_idea", content);
  }, [content]);

  // Auto-save Settings
  useEffect(() => {
    localStorage.setItem("obsidian_vault", vaultName);
    localStorage.setItem("obsidian_folder", folderPath);
    localStorage.setItem("obsidian_filename", fileNameTemplate);
    localStorage.setItem("obsidian_template", template);
    localStorage.setItem("use_browser_fallback", String(useBrowserFallback));
    localStorage.setItem("browser_language", browserLanguage);
  }, [vaultName, folderPath, fileNameTemplate, template, useBrowserFallback, browserLanguage]);

  // --- Core Functions ---

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  // Browser Speech Recognition (Fallback)
  const handleBrowserSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showToast("Browser speech recognition not supported.", 'error');
      setIsProcessing(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = browserLanguage; // User-configurable
    
    let finalTranscript = '';

    recognition.onstart = () => {
      setIsRecording(true);
      showToast(`Listening (${browserLanguage})...`, 'info');
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (finalTranscript.trim()) {
        setContent((prev) => prev + (prev ? "\n\n" : "") + finalTranscript.trim());
        showToast("Transcription complete (Browser)", 'success');
      } else {
        showToast("No speech detected", 'info');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error === 'no-speech') {
        showToast("No speech detected", 'info');
      } else {
        showToast(`Speech error: ${event.error}`, 'error');
      }
    };

    recognition.start();
  };

  // Gemini Audio Recording
  const handleGeminiRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         throw new Error("Microphone access is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const supportedType = getSupportedMimeType();
      const options = supportedType ? { mimeType: supportedType } : undefined;
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      recordingMimeTypeRef.current = supportedType || "";

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const finalMimeType = mediaRecorder.mimeType || recordingMimeTypeRef.current || "audio/mp4";
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        await processAudio(audioBlob, finalMimeType);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast("Recording (Gemini auto-detect)...", 'info');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      showToast("Could not access microphone.", 'error');
      setIsProcessing(false);
    }
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      // Stop Recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      } else {
        mediaRecorderRef.current?.stop();
        setIsProcessing(true);
      }
      setIsRecording(false);
    } else {
      // Start Recording: Try Gemini first
      await handleGeminiRecording();
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
              text: "Transcribe this audio. Auto-detect language (Chinese, English, or mixed). Transcribe exactly what is said, but fix minor stutters. Do not add any commentary."
            }
          ]
        }
      });

      const transcription = response.text || "";
      setContent((prev) => prev + (prev ? "\n\n" : "") + transcription);
      showToast("Transcription complete (Gemini)", 'success');
    } catch (error) {
      console.error("Gemini transcription failed", error);

      // Auto-fallback to browser if enabled
      if (useBrowserFallback) {
        showToast("Gemini failed. Trying browser fallback...", 'info');
        setIsProcessing(false);
        handleBrowserSpeechRecognition();
        return;
      } else {
        showToast("Transcription failed. Enable browser fallback in settings?", 'error');
      }
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

        STRICT RULES:
        1. DO NOT include any introductory phrases like "Here is your note" or "Okay, I've cleaned it up".
        2. DO NOT include any meta-commentary or conversational filler.
        3. OUTPUT ONLY the refined note content itself.
        4. Fix grammar and spelling.
        5. If it looks like a task, format it as a checklist item.
        6. Add a relevant #tag at the end based on the context.
        7. Keep the tone personal.
        8. Preserve the original language (Chinese stays Chinese, English stays English).
        
        Raw Note:
        ${content}`,
      });

      if (response.text) {
        setContent(response.text.trim());
        showToast("Note polished!", 'success');
      }
    } catch (error) {
      console.error("Polish failed", error);
      showToast("Could not polish text. Check connection.", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendToObsidian = () => {
    if (!vaultName) {
      showToast("Vault name is missing. Please configure settings.", 'error');
      setShowSettings(true);
      return;
    }
    if (!content.trim()) {
      showToast("Write something first!", 'info');
      return;
    }

    const filenameTemplate = fileNameTemplate || "{{date}} {{time}} Idea";
    let filename = formatWithTokens(filenameTemplate);
    
    filename = filename.replace(/[:\/\\?%*|"<>]/g, '-');

    const encodedVault = encodeURIComponent(vaultName.trim());
    
    const cleanFolder = folderPath.trim().replace(/\/$/, ""); 
    const fullPath = cleanFolder ? `${cleanFolder}/${filename}` : filename;
    const encodedFile = encodeURIComponent(fullPath);
    
    const finalContent = formatWithTokens(template || "{{content}}", content);
    const encodedContent = encodeURIComponent(finalContent);

    const uri = `obsidian://new?vault=${encodedVault}&file=${encodedFile}&content=${encodedContent}`;

    window.location.href = uri;
    showToast("Opening Obsidian...", 'info');
  };

  const handleClear = () => {
    if (content.trim()) {
      setShowClearConfirm(true);
    }
  };

  const confirmClear = () => {
    setContent("");
    setShowClearConfirm(false);
    showToast("Content cleared", 'info');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
      showToast("Copied to clipboard", 'success');
    } catch (err) {
      console.error('Failed to copy', err);
      showToast("Failed to copy", 'error');
    }
  };

  const handleSaveSettings = (newSettings: {
    vaultName: string;
    folderPath: string;
    fileNameTemplate: string;
    template: string;
    useBrowserFallback?: boolean;
    browserLanguage?: string;
  }) => {
    setVaultName(newSettings.vaultName);
    setFolderPath(newSettings.folderPath);
    setFileNameTemplate(newSettings.fileNameTemplate);
    setTemplate(newSettings.template);
    if (newSettings.useBrowserFallback !== undefined) {
      setUseBrowserFallback(newSettings.useBrowserFallback);
    }
    if (newSettings.browserLanguage) {
      setBrowserLanguage(newSettings.browserLanguage);
    }
    setShowSettings(false);
    showToast("Settings saved", 'success');
  };

  return (
    <div style={STYLES.container}>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <Header 
        onCopy={handleCopy} 
        copyFeedback={copyFeedback}
        onOpenSettings={() => setShowSettings(true)} 
      />

      <Editor 
        content={content}
        setContent={setContent}
        isRecording={isRecording}
        isProcessing={isProcessing}
        textareaRef={textareaRef}
      />

      <Toolbar 
        isRecording={isRecording}
        isProcessing={isProcessing}
        content={content}
        onRecordToggle={handleRecordToggle}
        onMagicPolish={handleMagicPolish}
        onClear={handleClear}
        onSendToObsidian={handleSendToObsidian}
      />

      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          currentSettings={{
            vaultName,
            folderPath,
            fileNameTemplate,
            template,
            useBrowserFallback,
            browserLanguage
          }}
        />
      )}

      {showClearConfirm && (
        <div style={STYLES.modalOverlay}>
          <div style={STYLES.modal}>
            <h2 style={{marginTop: 0, fontSize: '1.25rem'}}>Clear Content?</h2>
            <p style={{color: COLORS.textMuted, lineHeight: 1.5, marginBottom: '24px'}}>
              This will permanently delete your current note. This action cannot be undone.
            </p>
            <div style={{display: 'flex', gap: '12px'}}>
              <button 
                style={{...STYLES.button, ...STYLES.secondaryBtn}} 
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button 
                style={{...STYLES.button, backgroundColor: COLORS.danger, color: 'white', border: 'none', flex: 1}} 
                onClick={confirmClear}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
