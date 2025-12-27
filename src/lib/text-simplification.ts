/**
 * Simplify text layout for better Braille readability
 */
export function simplifyTextForBraille(text: string): string {
  let result = text;

  // Normalize line endings
  result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove excessive blank lines (more than 2 consecutive)
  result = result.replace(/\n{3,}/g, '\n\n');

  // Flatten multi-column layouts by removing tab-based columns
  result = result.replace(/\t+/g, ' ');

  // Remove multiple spaces (keep single spaces)
  result = result.replace(/ {2,}/g, ' ');

  // Normalize bullet points to consistent format
  result = result.replace(/^[\\s]*[•●○◦▪▸►‣⁃]\s*/gm, '• ');
  result = result.replace(/^[\\s]*[-–—]\s+/gm, '• ');

  // Normalize numbered lists
  result = result.replace(/^[\\s]*(\d+)[.)]\s*/gm, '$1. ');

  // Remove leading/trailing whitespace from each line
  result = result
    .split('\n')
    .map(line => line.trim())
    .join('\n');

  // Ensure paragraphs are preserved (single blank line between)
  result = result.replace(/([^\n])\n([^\n•\d])/g, (_, before, after) => {
    // If it looks like a sentence continuation, join
    if (before.match(/[a-z,]$/i) && after.match(/^[a-z]/i)) {
      return `${before} ${after}`;
    }
    return `${before}\n${after}`;
  });

  // Clean up any remaining multiple spaces
  result = result.replace(/ {2,}/g, ' ');

  return result.trim();
}
