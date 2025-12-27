import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed MIME types for image/document processing
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
];

// Maximum file size: 20MB (base64 is ~1.37x original size)
const MAX_BASE64_SIZE = 20 * 1024 * 1024 * 1.37;

// Validate base64 string format
function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  // Check for valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str);
}

// Validate image magic bytes to verify actual file format
function validateImageMagicBytes(base64Data: string, claimedMimeType: string): boolean {
  try {
    // Decode first 20 bytes to check magic numbers
    const headerBase64 = base64Data.substring(0, 30);
    const binaryStr = atob(headerBase64);
    
    // Convert to byte array for comparison
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Check magic bytes based on claimed type
    switch (claimedMimeType) {
      case 'image/jpeg':
        // JPEG starts with FF D8 FF
        return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
      case 'image/png':
        // PNG starts with 89 50 4E 47 0D 0A 1A 0A
        return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
      case 'image/gif':
        // GIF starts with GIF87a or GIF89a
        return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
      case 'image/webp':
        // WebP starts with RIFF....WEBP
        return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
      case 'application/pdf':
        // PDF starts with %PDF
        return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      console.error('Failed to parse request body');
      return new Response(
        JSON.stringify({ error: 'Invalid request format. Please send valid JSON.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { image, mimeType } = body;
    
    // Validate image data presence and type
    if (!image) {
      console.error('No image data provided');
      return new Response(
        JSON.stringify({ error: 'No image data provided. Please upload an image or PDF.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof image !== 'string') {
      console.error('Image data is not a string');
      return new Response(
        JSON.stringify({ error: 'Invalid image data format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate base64 format
    if (!isValidBase64(image)) {
      console.error('Invalid base64 encoding');
      return new Response(
        JSON.stringify({ error: 'Invalid image encoding. Please try uploading again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (image.length > MAX_BASE64_SIZE) {
      console.error('File too large:', image.length);
      return new Response(
        JSON.stringify({ error: 'File is too large. Maximum size is 20MB.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate MIME type
    const normalizedMimeType = mimeType?.toLowerCase() || 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.includes(normalizedMimeType)) {
      console.error('Unsupported file type:', normalizedMimeType);
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Please upload JPEG, PNG, WebP, GIF, or PDF.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate actual file content matches claimed type
    if (!validateImageMagicBytes(image, normalizedMimeType)) {
      console.error('File content does not match claimed type');
      return new Response(
        JSON.stringify({ error: 'File content does not match the expected format. Please ensure you are uploading a valid image or PDF.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Service configuration error. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing OCR request with validated image type:', normalizedMimeType, 'size:', image.length);

    // Use Gemini for OCR with timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an OCR (Optical Character Recognition) assistant. Your task is to extract ALL text from images accurately.

Instructions:
1. Extract every piece of text visible in the image
2. Preserve the original formatting as much as possible (paragraphs, line breaks, headings)
3. If text is in columns, read left to right, top to bottom
4. Correct obvious OCR errors (like 'rn' instead of 'm')
5. Keep punctuation and capitalization as in the original
6. For tables, preserve structure using spaces or tabs
7. If you cannot read a word clearly, make your best guess based on context
8. Return ONLY the extracted text, no explanations or comments`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please extract all text from this image. Return only the extracted text, preserving formatting.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${normalizedMimeType};base64,${image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Usage limit reached. Please check your account.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const extractedText = data.choices?.[0]?.message?.content || '';

      console.log('OCR completed, extracted', extractedText.length, 'characters');

      return new Response(
        JSON.stringify({ text: extractedText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('OCR request timed out');
        return new Response(
          JSON.stringify({ error: 'Request timed out. Please try with a smaller image.' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

  } catch (error: unknown) {
    console.error('OCR error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process image';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
