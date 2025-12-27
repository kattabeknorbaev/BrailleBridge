export interface UserFriendlyError {
  title: string;
  description: string;
  suggestion: string;
}

/**
 * Convert technical errors into user-friendly messages
 */
export function getErrorMessage(error: unknown, context?: string): UserFriendlyError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // No text detected
  if (
    lowerMessage.includes('no text') ||
    lowerMessage.includes('empty') ||
    lowerMessage.includes('could not extract')
  ) {
    return {
      title: 'No Text Detected',
      description: 'We couldn\'t find any readable text in your file.',
      suggestion: 'Try uploading a clearer image or a different document with visible text.',
    };
  }

  // File too large
  if (
    lowerMessage.includes('too large') ||
    lowerMessage.includes('file size') ||
    lowerMessage.includes('payload')
  ) {
    return {
      title: 'File Too Large',
      description: 'The file you uploaded is too large to process.',
      suggestion: 'Please upload a file smaller than 20MB, or try compressing the image first.',
    };
  }

  // Unsupported format
  if (
    lowerMessage.includes('unsupported') ||
    lowerMessage.includes('invalid file') ||
    lowerMessage.includes('format')
  ) {
    return {
      title: 'Unsupported File Format',
      description: 'This file type is not supported.',
      suggestion: 'Please upload a PDF, JPG, PNG, or WebP file.',
    };
  }

  // Network/connection errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('timeout')
  ) {
    return {
      title: 'Connection Error',
      description: 'We couldn\'t connect to the server.',
      suggestion: 'Please check your internet connection and try again.',
    };
  }

  // Rate limiting
  if (lowerMessage.includes('rate') || lowerMessage.includes('429')) {
    return {
      title: 'Too Many Requests',
      description: 'You\'ve made too many requests in a short time.',
      suggestion: 'Please wait a moment and try again.',
    };
  }

  // OCR specific failures
  if (context === 'ocr') {
    return {
      title: 'Text Extraction Failed',
      description: 'We had trouble reading the text from your file.',
      suggestion: 'Try using a clearer image with good lighting, or ensure the document isn\'t handwritten.',
    };
  }

  // Conversion failures
  if (context === 'conversion') {
    return {
      title: 'Conversion Failed',
      description: 'We couldn\'t convert your text to Braille.',
      suggestion: 'Please try again. If the problem continues, try with a shorter text.',
    };
  }

  // Generic fallback
  return {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred while processing your request.',
    suggestion: 'Please try again. If the problem continues, refresh the page and start over.',
  };
}
