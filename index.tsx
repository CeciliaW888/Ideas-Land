import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

import { Header } from "./components/Header";
import { Editor } from "./components/Editor";
import { Toolbar } from "./components/Toolbar";
import { SettingsModal } from "./components/SettingsModal";
import { STYLES, COLORS } from "./utils/styles";
import { blobToBase64, getSupportedMimeType, formatWithTokens } from "./utils/helpers";

// --- Main Application ---

const App = () => {
  // State
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Settings - Initialize from LocalStorage or Defaults
  const [vaultName, setVaultName] = useState(() => localStorage.getItem("obsidian_vault") || "");
  const [folderPath, setFolderPath] = useState(() => {
    const saved = localStorage.getItem("obsidian_folder");
    return saved !== null ? saved : ""; 
  });
  const [fileNameTemplate, setFileNameTemplate] = useState(() => localStorage.getItem("obsidian_filename") || "{{date}} {{time}} Idea");
  const [template, setTemplate] = useState(() => localStorage.getItem("obsidian_template") || "{{content}}");

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingMimeTypeRef = useRef<string>("");

  // Initialize Content
  useEffect(() => {
    // Restore unsaved content
    const savedContent = localStorage.getItem("unsaved_idea");
    if (savedContent) setContent(savedContent);
  }, []);

  // Save content to local storage on change
  useEffect(() => {
    localStorage.setItem("unsaved_idea", content);
  }, [content]);

  // Auto-save Settings
  // This runs whenever settings state changes (e.g., after closing settings modal with new values)
  useEffect(() => {
    localStorage.setItem("obsidian_vault", vaultName);
    localStorage.setItem("obsidian_folder", folderPath);
    localStorage.setItem("obsidian_filename", fileNameTemplate);
    localStorage.setItem("obsidian_template", template);
  }, [vaultName, folderPath, fileNameTemplate, template]);

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

    const filenameTemplate = fileNameTemplate || "{{date}} {{time}} Idea";
    let filename = formatWithTokens(filenameTemplate);
    
    // Sanitize filename: replace colons and slashes with dashes
    filename = filename.replace(/[:\/\\?%*|"<>]/g, '-');

    // Trim vault name to ensure no trailing spaces cause "Vault Not Found" errors
    const encodedVault = encodeURIComponent(vaultName.trim());
    
    // Construct file path: trim slash logic to ensure clean paths
    const cleanFolder = folderPath.trim().replace(/\/$/, ""); 
    const fullPath = cleanFolder ? `${cleanFolder}/${filename}` : filename;
    const encodedFile = encodeURIComponent(fullPath);
    
    // Apply template before encoding
    const finalContent = formatWithTokens(template || "{{content}}", content);
    const encodedContent = encodeURIComponent(finalContent);

    // Construct Obsidian URI
    const uri = `obsidian://new?vault=${encodedVault}&file=${encodedFile}&content=${encodedContent}`;

    window.location.href = uri;
  };

  const handleClear = () => {
    if (content.trim() && window.confirm("Clear all content?")) {
      setContent("");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSaveSettings = (newSettings: {
    vaultName: string;
    folderPath: string;
    fileNameTemplate: string;
    template: string;
  }) => {
    setVaultName(newSettings.vaultName);
    setFolderPath(newSettings.folderPath);
    setFileNameTemplate(newSettings.fileNameTemplate);
    setTemplate(newSettings.template);
    setShowSettings(false);
  };

  return (
    <div style={STYLES.container}>
      <Header 
        onCopy={handleCopy} 
        onOpenSettings={() => setShowSettings(true)} 
        copyFeedback={copyFeedback} 
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
            template
          }}
        />
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