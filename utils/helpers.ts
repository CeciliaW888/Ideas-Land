export const blobToBase64 = (blob: Blob): Promise<string> => {
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

export const getSupportedMimeType = () => {
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

export const formatWithTokens = (template: string, content: string = ""): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hour = pad(now.getHours());
  const minute = pad(now.getMinutes());
  const second = pad(now.getSeconds());

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}`; // Standard time format

  const replacements: Record<string, string> = {
    '{{content}}': content,
    '{{date}}': dateStr,
    '{{time}}': timeStr,
    '{{year}}': year.toString(),
    '{{month}}': month,
    '{{day}}': day,
    '{{hour}}': hour,
    '{{minute}}': minute,
    '{{second}}': second,
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    // Replace all occurrences
    result = result.split(key).join(value);
  }
  return result;
};