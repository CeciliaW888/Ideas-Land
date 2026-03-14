# PR Review: 🎙️ Gemini-First Auto-Fallback Transcription (#1)

## Summary
This PR adds an intelligent voice transcription fallback system: Gemini handles primary transcription with auto language detection, and browser-based Web Speech API kicks in as a free fallback when Gemini fails (e.g., quota exceeded). A new settings panel lets users toggle fallback and select browser language.

## Overall Assessment
The feature concept is solid and solves a real problem (data loss on API failure). The implementation is mostly clean but has several issues that should be addressed before merging.

---

## Bugs & Issues

### 1. `isProcessing` state not reset in the fallback path (High)
**File:** `index.tsx`, `processAudio` function

In the `catch` block of `processAudio`, when `useBrowserFallback` is true, `setIsProcessing(false)` is called before launching `handleBrowserSpeechRecognition()`. However, in the `finally` block, `setIsProcessing(false)` is conditionally skipped only when `useBrowserFallback` is enabled — but this runs even on the **success** path. This means on a successful Gemini transcription with fallback enabled, `isProcessing` is never set to `false`.

```typescript
// Current code (broken):
} finally {
  if (!useBrowserFallback) {  // ← skips reset even on success!
    setIsProcessing(false);
  }
}
```

**Fix:** The `finally` block should always reset `isProcessing`. Move the conditional logic to only the `catch` block:
```typescript
} catch (error) {
  if (useBrowserFallback) {
    showToast("Gemini failed. Trying browser fallback...", 'info');
    setIsProcessing(false);
    handleBrowserSpeechRecognition();
    return; // exit early so finally doesn't also reset
  }
  showToast("Transcription failed...", 'error');
} finally {
  setIsProcessing(false);
}
```

### 2. `recognitionRef` not cleared after use (Medium)
**File:** `index.tsx`

`recognitionRef.current` is set when browser fallback starts but never cleared when recognition ends. This means subsequent stop actions (`handleRecordToggle`) will incorrectly try to call `.stop()` on a stale recognition object instead of stopping the MediaRecorder.

**Fix:** Set `recognitionRef.current = null` in the `onend` and `onerror` handlers.

### 3. Browser fallback `isProcessing` not managed (Medium)
**File:** `index.tsx`, `handleBrowserSpeechRecognition`

The function is called with `setIsProcessing(false)` before it, but the function itself never resets `isProcessing` either. If called from the fallback path after Gemini failure, processing state is fine. But if it were ever called directly, the `isProcessing` state at the entry point (line in `handleGeminiRecording`) would remain unset. Minor now, but fragile.

---

## Design Concerns

### 4. Two completely different recording mechanisms share one toggle (Medium)
The `handleRecordToggle` always starts Gemini recording. Browser fallback only activates on Gemini *failure* during `processAudio`. This means the user must record audio, wait for Gemini to fail, then the browser re-starts a *live* speech recognition session — but the original audio is already lost. The fallback doesn't re-transcribe the same audio; it asks the user to speak again (implicitly).

**Suggestion:** Make this clearer in the UX. Consider either:
- Showing a toast like "Gemini failed. Please speak again for browser transcription."
- Or, better: attempt browser transcription *of the same audio blob* if possible (though Web Speech API doesn't support this, so document the limitation).

### 5. Inline settings type duplication (Low)
**File:** `index.tsx`, line ~327

The `handleSaveSettings` parameter type is defined inline and duplicates the `Settings` interface from `SettingsModal.tsx`. Import and reuse the interface instead.

### 6. Hardcoded default language `zh-CN` (Low)
The default browser language is hardcoded to Chinese Simplified. Consider detecting the browser's locale via `navigator.language` as a smarter default for international users.

---

## Code Quality

### 7. Removed comments reduce readability (Low)
Several helpful explanatory comments were removed (e.g., "Sanitize filename", "Trim vault name", "Construct Obsidian URI"). These were useful for understanding intent. Consider keeping them.

### 8. `any` types for Web Speech API (Low)
**File:** `index.tsx`

`recognitionRef` is typed as `any`, and the Speech Recognition events use `any`. Consider using the `@types/dom-speech-recognition` package or declaring minimal interfaces for better type safety.

---

## Documentation
The `docs/GEMINI-FIRST-UPGRADE.md` is well-written and clearly explains the upgrade. One note: the "Zero data loss" claim should be qualified — the browser fallback requires the user to re-speak, so the original recording *is* lost if Gemini fails.

---

## Verdict
**Request changes.** The `isProcessing` state bug (#1) will cause the UI to appear permanently stuck in "processing" state after every successful Gemini transcription when fallback is enabled (which is the default). This needs to be fixed before merging. Issues #2 and #4 should also be addressed for correctness.
