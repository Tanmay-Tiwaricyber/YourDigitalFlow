// Utility functions module
// For image compression, resizing, and helpers

/**
 * Resize and compress an image file to maxWidth px and JPEG quality.
 * Returns a Promise that resolves to a Base64 data URI.
 */
export function compressImage(file, maxWidth = 500, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => {
      img.src = e.target.result;
    };
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = img.width * scale;
      const h = img.height * scale;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      }, 'image/jpeg', quality);
    };
    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: generate a unique ID for media
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
