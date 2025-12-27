// Unified English Braille (UEB) conversion utilities

// Grade 1 Braille mapping (letter-by-letter)
const GRADE1_MAP: Record<string, string> = {
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
  'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
  'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
  'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
  'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽',
  'z': '⠵',
  '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑',
  '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',
  ' ': '⠀',
  '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒', '!': '⠖',
  '?': '⠦', "'": '⠄', '"': '⠐⠦', '-': '⠤', '(': '⠐⠣',
  ')': '⠐⠜', '/': '⠸⠌', '@': '⠈⠁', '#': '⠸⠹', '$': '⠈⠎',
  '%': '⠨⠴', '&': '⠈⠯', '*': '⠐⠔', '+': '⠐⠖', '=': '⠐⠶',
  '\n': '\n',
};

// Number indicator for Grade 1
const NUMBER_INDICATOR = '⠼';

// Capital letter indicator
const CAPITAL_INDICATOR = '⠠';

// Word capital indicator (for all caps)
const WORD_CAPITAL_INDICATOR = '⠠⠠';

// Grade 2 contractions (common words/letter combinations)
const GRADE2_CONTRACTIONS: Record<string, string> = {
  // Single letter word signs
  'but': '⠃', 'can': '⠉', 'do': '⠙', 'every': '⠑', 'from': '⠋',
  'go': '⠛', 'have': '⠓', 'just': '⠚', 'knowledge': '⠅', 'like': '⠇',
  'more': '⠍', 'not': '⠝', 'people': '⠏', 'quite': '⠟', 'rather': '⠗',
  'so': '⠎', 'that': '⠞', 'us': '⠥', 'very': '⠧', 'will': '⠺',
  'it': '⠭', 'you': '⠽', 'as': '⠵',
  
  // Common words
  'the': '⠮', 'and': '⠯', 'for': '⠿', 'of': '⠷', 'with': '⠾',
  'child': '⠡', 'shall': '⠩', 'this': '⠹', 'which': '⠱', 'out': '⠳',
  'still': '⠌',
  
  // Common letter combinations
  'ch': '⠡', 'gh': '⠣', 'sh': '⠩', 'th': '⠹', 'wh': '⠱',
  'ed': '⠫', 'er': '⠻', 'ou': '⠳', 'ow': '⠪', 'st': '⠌',
  'ar': '⠜', 'ing': '⠬', 'ble': '⠼',
  
  // Lower group signs
  'be': '⠆', 'con': '⠒', 'dis': '⠲', 'en': '⠢', 'in': '⠔',
  'were': '⠶', 'his': '⠦', 'was': '⠴', 
};

// BRF (Braille Ready Format) character mapping
const BRF_MAP: Record<string, string> = {
  '⠀': ' ', '⠁': 'A', '⠃': 'B', '⠉': 'C', '⠙': 'D', '⠑': 'E',
  '⠋': 'F', '⠛': 'G', '⠓': 'H', '⠊': 'I', '⠚': 'J',
  '⠅': 'K', '⠇': 'L', '⠍': 'M', '⠝': 'N', '⠕': 'O',
  '⠏': 'P', '⠟': 'Q', '⠗': 'R', '⠎': 'S', '⠞': 'T',
  '⠥': 'U', '⠧': 'V', '⠺': 'W', '⠭': 'X', '⠽': 'Y',
  '⠵': 'Z', '⠲': '.', '⠂': ',', '⠆': ';', '⠒': ':',
  '⠖': '!', '⠦': '?', '⠄': "'", '⠤': '-', '⠐': ',',
  '⠣': '<', '⠜': '>', '⠸': '[', '⠌': '/', '⠈': '@',
  '⠹': '#', '⠨': '^', '⠴': '%', '⠯': '&', '⠔': '*',
  '⠶': '+', '⠼': '#', '⠠': ',', '⠮': '>', '⠿': '=',
  '⠷': '[', '⠾': ']', '⠡': '1', '⠩': '!', '⠱': '%',
  '⠳': 'O', '⠫': '$', '⠻': ']', '⠪': ',', '⠬': '5',
};

export type BrailleGrade = 'grade1' | 'grade2';

/**
 * Convert text to Braille Unicode
 */
export function textToBraille(text: string, grade: BrailleGrade = 'grade1'): string {
  if (grade === 'grade2') {
    return textToBrailleGrade2(text);
  }
  return textToBrailleGrade1(text);
}

/**
 * Grade 1 Braille conversion (letter-by-letter)
 */
function textToBrailleGrade1(text: string): string {
  let result = '';
  let inNumber = false;
  let prevWasUpper = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const lowerChar = char.toLowerCase();
    
    // Handle numbers
    if (/[0-9]/.test(char)) {
      if (!inNumber) {
        result += NUMBER_INDICATOR;
        inNumber = true;
      }
      result += GRADE1_MAP[char] || char;
      continue;
    } else {
      inNumber = false;
    }
    
    // Handle uppercase
    if (char !== lowerChar && /[A-Z]/.test(char)) {
      // Check for all caps word
      const nextChar = text[i + 1];
      if (prevWasUpper && nextChar && nextChar === nextChar.toUpperCase() && /[A-Z]/.test(nextChar)) {
        // Continue word capital mode
      } else if (nextChar && nextChar === nextChar.toUpperCase() && /[A-Z]/.test(nextChar)) {
        result += WORD_CAPITAL_INDICATOR;
        prevWasUpper = true;
      } else {
        result += CAPITAL_INDICATOR;
        prevWasUpper = false;
      }
      result += GRADE1_MAP[lowerChar] || char;
    } else {
      prevWasUpper = false;
      result += GRADE1_MAP[lowerChar] || GRADE1_MAP[char] || char;
    }
  }
  
  return result;
}

/**
 * Grade 2 Braille conversion (with contractions)
 */
function textToBrailleGrade2(text: string): string {
  let result = '';
  const words = text.split(/(\s+)/);
  
  for (const word of words) {
    if (/^\s+$/.test(word)) {
      result += word.replace(/ /g, '⠀');
      continue;
    }
    
    const lowerWord = word.toLowerCase();
    
    // Check for whole word contractions
    if (GRADE2_CONTRACTIONS[lowerWord]) {
      if (word[0] === word[0].toUpperCase()) {
        result += CAPITAL_INDICATOR;
      }
      result += GRADE2_CONTRACTIONS[lowerWord];
    } else {
      // Apply partial contractions and convert remaining letters
      let processed = lowerWord;
      let brailleWord = '';
      let i = 0;
      
      while (i < processed.length) {
        let found = false;
        
        // Try to match contractions (longest first)
        for (let len = 3; len >= 2; len--) {
          const substr = processed.substring(i, i + len);
          if (GRADE2_CONTRACTIONS[substr]) {
            brailleWord += GRADE2_CONTRACTIONS[substr];
            i += len;
            found = true;
            break;
          }
        }
        
        if (!found) {
          const char = processed[i];
          const originalChar = word[i];
          
          if (originalChar && originalChar === originalChar.toUpperCase() && /[A-Z]/.test(originalChar)) {
            brailleWord += CAPITAL_INDICATOR;
          }
          
          brailleWord += GRADE1_MAP[char] || char;
          i++;
        }
      }
      
      result += brailleWord;
    }
  }
  
  return result;
}

/**
 * Convert Braille Unicode to BRF format
 */
export function brailleToBRF(braille: string): string {
  let result = '';
  
  for (const char of braille) {
    if (char === '\n') {
      result += '\n';
    } else if (BRF_MAP[char]) {
      result += BRF_MAP[char];
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Get the dot pattern for a Braille character
 * Returns array of 6 booleans [1,2,3,4,5,6] where:
 * 1 4
 * 2 5
 * 3 6
 */
export function getBrailleDots(char: string): boolean[] {
  const code = char.charCodeAt(0);
  
  // Braille patterns are in Unicode range U+2800 to U+28FF
  if (code < 0x2800 || code > 0x28FF) {
    return [false, false, false, false, false, false];
  }
  
  const offset = code - 0x2800;
  
  return [
    (offset & 0x01) !== 0, // Dot 1
    (offset & 0x02) !== 0, // Dot 2
    (offset & 0x04) !== 0, // Dot 3
    (offset & 0x08) !== 0, // Dot 4
    (offset & 0x10) !== 0, // Dot 5
    (offset & 0x20) !== 0, // Dot 6
  ];
}

/**
 * Generate DXP format (basic implementation)
 * Note: DXP format varies by embosser manufacturer
 */
export function brailleToDXP(braille: string, options: {
  cellsPerLine?: number;
  linesPerPage?: number;
} = {}): string {
  const cellsPerLine = options.cellsPerLine || 40;
  const linesPerPage = options.linesPerPage || 25;
  
  // DXP header
  let dxp = `\x1b[K1\x1b[K4${cellsPerLine}\x1b[K5${linesPerPage}`;
  
  // Convert Braille to DXP character codes
  for (const char of braille) {
    if (char === '\n') {
      dxp += '\r\n';
    } else {
      const code = char.charCodeAt(0);
      if (code >= 0x2800 && code <= 0x28FF) {
        // Map to DXP code (offset from base)
        dxp += String.fromCharCode(code - 0x2800 + 0x20);
      } else {
        dxp += char;
      }
    }
  }
  
  return dxp;
}

/**
 * Split text into paragraphs preserving structure
 */
export function parseTextStructure(text: string): {
  type: 'heading' | 'paragraph';
  content: string;
  level?: number;
}[] {
  const lines = text.split('\n');
  const result: { type: 'heading' | 'paragraph'; content: string; level?: number }[] = [];
  let currentParagraph = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      if (currentParagraph) {
        result.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      continue;
    }
    
    // Detect headings (short lines that are all caps or end without punctuation)
    const isShortLine = trimmedLine.length < 60;
    const isAllCaps = trimmedLine === trimmedLine.toUpperCase() && /[A-Z]/.test(trimmedLine);
    const endsWithoutPunctuation = !/[.!?]$/.test(trimmedLine);
    
    if (isShortLine && isAllCaps && endsWithoutPunctuation) {
      if (currentParagraph) {
        result.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      result.push({ type: 'heading', content: trimmedLine, level: 1 });
    } else {
      currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
    }
  }
  
  if (currentParagraph) {
    result.push({ type: 'paragraph', content: currentParagraph.trim() });
  }
  
  return result;
}
