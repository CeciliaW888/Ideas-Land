# User Guide

## Getting Started

1.  **Open the App**: Load the URL on your mobile device.
2.  **Permissions**: Allow microphone access when prompted (only needed if you plan to use voice).
3.  **Setup**: Click the **Settings (Gear Icon)** in the top right.

## Configuration

### Obsidian Settings
To use the "Send to Obsidian" button, you must configure your vault:

*   **Vault Name**: The exact case-sensitive name of your vault (e.g., `MySecondBrain`).
*   **Inbox Folder Path**:
    *   Leave **Empty** to save files in the root of your vault.
    *   Enter a folder name (e.g., `Inbox` or `00_Inbox`) to save notes there. The folder must exist in Obsidian.
*   **Template**: Customize how your note looks.
    *   `{{content}}`: The text you wrote.
    *   `{{date}}`: Current date (YYYY-MM-DD).
    *   `{{time}}`: Current time (HH:MM).

**Example Template:**
```markdown
---
type: fleeting
created: {{date}} {{time}}
---
# Idea
{{content}}

#inbox
```

## Features

### 1. Voice Notes
Tap the **Microphone** icon. Speak your thought. Tap it again to stop.
*   The app uses Gemini AI to transcribe your audio intelligently (removing "umms" and stutters).
*   The text is appended to the editor.

### 2. Magic Polish
Tap the **Sparkles (Polish)** button.
*   The AI will rewrite your rough note into clean Markdown.
*   It fixes spelling, formatting, and may add relevant tags.

### 3. Saving & Sharing
*   **Obsidian Button**: Opens the Obsidian app and creates a new file based on your settings.
*   **Share Button**: Opens the native iOS/Android share sheet (Send to WhatsApp, Reminders, Apple Notes, etc.).
*   **Copy Button**: Copies the *raw* text (ignoring the template) to your clipboard.
