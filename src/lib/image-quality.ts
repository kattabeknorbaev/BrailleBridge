export interface ImageQualityResult {
  isGood: boolean;
  issues: string[];
  message: string;
}

/**
 * Analyze image quality for OCR suitability
 * Returns advisory feedback about image quality
 */
export async function analyzeImageQuality(file: File): Promise<ImageQualityResult> {
  return new Promise((resolve) => {
    // Only analyze images, not PDFs
    if (!file.type.startsWith('image/')) {
      resolve({
        isGood: true,
        issues: [],
        message: 'Document ready for text extraction.',
      });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const issues: string[] = [];

      // Check image dimensions (too small = likely poor quality)
      if (img.width < 400 || img.height < 400) {
        issues.push('Image resolution is low');
      }

      // Check aspect ratio (very skewed might indicate a tilted photo)
      const aspectRatio = img.width / img.height;
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        issues.push('Unusual aspect ratio detected');
      }

      // Check file size relative to dimensions (very small = high compression/blur)
      const pixelCount = img.width * img.height;
      const bytesPerPixel = file.size / pixelCount;
      if (bytesPerPixel < 0.1 && file.type !== 'image/png') {
        issues.push('Image may be heavily compressed');
      }

      // Very large images might be fine but could slow processing
      if (file.size > 10 * 1024 * 1024) {
        issues.push('Large file may take longer to process');
      }

      if (issues.length === 0) {
        resolve({
          isGood: true,
          issues: [],
          message: 'Image quality looks good for text recognition.',
        });
      } else {
        resolve({
          isGood: false,
          issues,
          message: 'Image quality may reduce OCR accuracy. Consider retaking the photo with better lighting.',
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isGood: true,
        issues: [],
        message: 'Ready for processing.',
      });
    };

    img.src = url;
  });
}
