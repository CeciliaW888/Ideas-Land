# Architecture Overview

## Core Philosophy
**"No Backend, No Database, AI-First."**

The application is designed to be ephemeral. It holds data only long enough to capture, polish, and hand it off to a permanent storage system (Obsidian).

## Tech Stack

### Frontend
- **React**: Used for UI state management.
- **Lucide React**: For lightweight, consistent iconography.
- **ES Modules**: The app runs directly in the browser via ESM imports (no complex build step required for this dev environment).

### AI & Logic
- **Google GenAI SDK**: Direct client-side calls to Gemini models.
- **Model**: `gemini-2.0-flash-exp`. Chosen for its speed (essential for a "fleeting" note app) and multimodal capabilities (audio processing).
- **Audio Processing**:
    1.  Browser `MediaRecorder` captures audio (WebM/MP4).
    2.  Blob is converted to Base64.
    3.  Sent directly to Gemini as a file part for native audio understanding (no intermediate Speech-to-Text API required).

### Data Persistence
- **LocalStorage**:
    - `unsaved_idea`: Persists the editor content to handle page reloads.
    - `obsidian_vault`, `obsidian_folder`, `obsidian_template`: Stores user configuration.
- **Export Mechanism**:
    - **Obsidian URI Scheme**: We use the `obsidian://` protocol. This allows the web app to interact with the locally installed Obsidian app on iOS/Android/Desktop without requiring file system access permissions.
    - **Web Share API**: Uses `navigator.share` to tap into the OS-level sharing capabilities.

## Key Architectural Decisions

### 1. Client-Side API Key
*Decision*: The API Key is injected via `process.env.API_KEY` and used directly in the browser.
*Reasoning*: For a personal tool/MVP, this reduces complexity by removing the need for a proxy server.
*Trade-off*: In a commercial production environment, this would be a security risk. For a personal PWA, the risk is managed by the user controlling their own environment.

### 2. Deep Linking vs. File System API
*Decision*: Use `obsidian://new` instead of the File System Access API.
*Reasoning*:
    - Mobile browsers (iOS Safari particularly) have very restricted access to the local file system.
    - Deep linking delegates the "saving" action to the Obsidian app, which already has the necessary write permissions.
    - It works offline (conceptually), though the browser needs to trigger the link.

### 3. Template Engine
*Decision*: Simple string replacement regex.
*Reasoning*: We only need basic timestamp and content insertion. Importing a heavy templating library (like Handlebars) would increase bundle size unnecessarily.
