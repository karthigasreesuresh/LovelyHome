/**
 * Preprocesses a prescription image to enhance contrast, convert to high-contrast grayscale,
 * and apply adaptive thresholding for optimal Tesseract OCR performance.
 */
export const preprocessImageForOcr = (file: File): Promise<{ processedBlob: Blob; processedDataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Unable to create canvas context for image preprocessing'));
        return;
      }

      // Scale canvas to optimal resolution (min width 1600px for handwritten OCR detail)
      const scale = Math.max(1, 1600 / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      // Draw original image scaled
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 1. Grayscale & Contrast Enhancement
      const contrastFactor = 1.6; // Increase contrast
      const intercept = 128 * (1 - contrastFactor);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Luminance grayscale
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply contrast stretch
        gray = gray * contrastFactor + intercept;
        gray = Math.min(255, Math.max(0, gray));

        // High-contrast binarization (Thresholding around 140)
        const threshold = 145;
        const finalVal = gray > threshold ? 255 : 0;

        data[i] = finalVal;
        data[i + 1] = finalVal;
        data[i + 2] = finalVal;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const processedDataUrl = canvas.toDataURL('image/png');
          resolve({ processedBlob: blob, processedDataUrl });
        } else {
          reject(new Error('Canvas toBlob conversion failed'));
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
};
