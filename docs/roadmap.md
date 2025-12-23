# Roadmap: Idea Land PWA

## Project Goal
To build a lightweight, mobile-first Progressive Web Application (PWA) that acts as a "fleeting note" inbox. It allows users to quickly capture ideas via text or voice, process them with AI, and export them directly to an Obsidian vault or other apps.

## ✅ Completed Features (MVP)

### Core Interaction
- [x] **Quick Text Entry**: Minimalist text editor that auto-focuses on load.
- [x] **Voice Capture**: One-tap recording using the browser's `MediaRecorder` API.
- [x] **AI Transcription**: Uses Google Gemini 2.0 Flash to transcribe audio to text with high accuracy.
- [x] **"Magic Polish"**: AI processing to fix grammar, format as Markdown, and auto-tag notes.
- [x] **Draft Persistence**: Auto-saves current text to `localStorage` to prevent data loss on refresh.

### Integrations & Export
- [x] **Obsidian Deep Links**: Generates `obsidian://new` URIs to create notes directly in a local Obsidian vault.
- [x] **Native Share Sheet**: Uses the Web Share API for native mobile sharing integration.
- [x] **Clipboard Copy**: Fallback button to copy text for manual pasting.

### Customization
- [x] **Vault Configuration**: Setting to define the target Obsidian Vault name.
- [x] **Flexible Folder Paths**: Optional folder path (supports root or nested folders like `Inbox/Ideas`).
- [x] **Templating System**: Support for `{{content}}`, `{{date}}`, and `{{time}}` placeholders.

## 🚧 In Progress / Refinements
- [ ] **PWA Manifest**: Adding `manifest.json` and service workers to allow "Add to Home Screen" and offline caching of the app shell.
- [ ] **Error Handling**: Better UI feedback for API limits or network failures.

## 🔮 Future Ideas
- **History/Archive**: Store the last 10 notes locally in case an export fails or is forgotten.
- **Image Support**: Allow uploading or taking a picture to add context to the note (Gemini Multimodal).
- **Auto-Tagging Configuration**: Allow users to define a specific set of tags for the AI to choose from.
- **Append Mode**: Option to append to an existing "Daily Note" instead of creating a new file for every idea.
