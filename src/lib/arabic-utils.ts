/**
 * Arabic text normalization utilities for search
 */

// Map of characters to normalize
const arabicNormalizationMap: Record<string, string> = {
  'أ': 'ا',
  'إ': 'ا',
  'آ': 'ا',
  'ٱ': 'ا',
  'ة': 'ه',
  'ى': 'ي',
  'ؤ': 'و',
  'ئ': 'ي',
};

// Diacritics to remove (tashkeel)
const diacriticsRegex = /[\u064B-\u065F\u0670]/g;

/**
 * Normalize Arabic text for consistent searching
 * - Normalizes alef variants (أ إ آ) to ا
 * - Normalizes taa marbuta (ة) to هاء (ه)
 * - Normalizes yaa variants
 * - Removes diacritics (tashkeel)
 * - Removes spaces for comparison (عبد الرحمن = عبدالرحمن)
 */
export function normalizeArabic(text: string, removeSpaces = false): string {
  if (!text) return '';
  
  // Remove diacritics first
  let normalized = text.replace(diacriticsRegex, '');
  
  // Apply character normalization
  for (const [from, to] of Object.entries(arabicNormalizationMap)) {
    normalized = normalized.split(from).join(to);
  }
  
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Optionally remove all spaces for compound name matching
  if (removeSpaces) {
    normalized = normalized.replace(/\s/g, '');
  }
  
  return normalized.toLowerCase();
}

/**
 * Fuzzy match Arabic names
 * Matches if:
 * 1. Search terms appear in the name IN ORDER
 * 2. Search without spaces matches name without spaces (عبدالرحمن = عبد الرحمن)
 * Example: "محمد ابراهيم" matches "محمد علي ابراهيم" but NOT "ابراهيم محمد"
 * Example: "عبدالرحمن" matches "عبد الرحمن"
 */
export function fuzzyMatchArabic(searchQuery: string, targetText: string): boolean {
  const normalizedQuery = normalizeArabic(searchQuery);
  const normalizedTarget = normalizeArabic(targetText);
  
  // Direct match without spaces (handles عبدالرحمن = عبد الرحمن)
  const queryNoSpaces = normalizeArabic(searchQuery, true);
  const targetNoSpaces = normalizeArabic(targetText, true);
  
  if (targetNoSpaces.includes(queryNoSpaces)) {
    return true;
  }
  
  // Split search query into terms
  const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 0);
  
  // All search terms must be found IN ORDER in the target
  let lastIndex = -1;
  for (const term of searchTerms) {
    const index = normalizedTarget.indexOf(term, lastIndex + 1);
    if (index === -1 || index <= lastIndex) {
      return false;
    }
    lastIndex = index;
  }
  
  return true;
}

/**
 * Calculate match score for ranking results
 * Higher score = better match
 */
export function getMatchScore(searchQuery: string, targetText: string): number {
  const normalizedQuery = normalizeArabic(searchQuery);
  const normalizedTarget = normalizeArabic(targetText);
  
  // Check spaceless match
  const queryNoSpaces = normalizeArabic(searchQuery, true);
  const targetNoSpaces = normalizeArabic(targetText, true);
  
  // Exact match gets highest score
  if (normalizedTarget === normalizedQuery || targetNoSpaces === queryNoSpaces) return 100;
  
  // Starts with query gets high score
  if (normalizedTarget.startsWith(normalizedQuery) || targetNoSpaces.startsWith(queryNoSpaces)) return 80;
  
  // Contains query gets medium score
  if (normalizedTarget.includes(normalizedQuery) || targetNoSpaces.includes(queryNoSpaces)) return 60;
  
  // Fuzzy match (all terms found) gets lower score
  if (fuzzyMatchArabic(searchQuery, targetText)) return 40;
  
  return 0;
}
