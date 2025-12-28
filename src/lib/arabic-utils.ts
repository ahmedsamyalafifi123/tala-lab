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
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  
  // Remove diacritics first
  let normalized = text.replace(diacriticsRegex, '');
  
  // Apply character normalization
  for (const [from, to] of Object.entries(arabicNormalizationMap)) {
    normalized = normalized.split(from).join(to);
  }
  
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized.toLowerCase();
}

/**
 * Fuzzy match Arabic names
 * Matches if all search terms appear in the name (in any order)
 * Example: "جمال شحاتة" matches "جمال عمر السيد شحاته"
 */
export function fuzzyMatchArabic(searchQuery: string, targetText: string): boolean {
  const normalizedQuery = normalizeArabic(searchQuery);
  const normalizedTarget = normalizeArabic(targetText);
  
  // Split search query into terms
  const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 0);
  
  // All search terms must be found in the target
  return searchTerms.every(term => normalizedTarget.includes(term));
}

/**
 * Calculate match score for ranking results
 * Higher score = better match
 */
export function getMatchScore(searchQuery: string, targetText: string): number {
  const normalizedQuery = normalizeArabic(searchQuery);
  const normalizedTarget = normalizeArabic(targetText);
  
  // Exact match gets highest score
  if (normalizedTarget === normalizedQuery) return 100;
  
  // Starts with query gets high score
  if (normalizedTarget.startsWith(normalizedQuery)) return 80;
  
  // Contains query gets medium score
  if (normalizedTarget.includes(normalizedQuery)) return 60;
  
  // Fuzzy match (all terms found) gets lower score
  if (fuzzyMatchArabic(searchQuery, targetText)) return 40;
  
  return 0;
}
