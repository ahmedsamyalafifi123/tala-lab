// ============================================================================
// LAB TEST UTILITY FUNCTIONS
// ============================================================================

import type {
  ReferenceRange,
  ReferenceRanges,
  ResultFlag,
  LabTest,
  GroupedTests,
} from '@/types/results';

/**
 * Calculate result flag based on value and reference range
 * @param value - The test result value
 * @param referenceRanges - Reference ranges (can be gender/age specific)
 * @param gender - Patient gender ('male' | 'female' | 'ذكر' | 'أنثى')
 * @param age - Patient age (optional)
 * @returns ResultFlag indicating if value is normal/high/low
 */
export function calculateFlag(
  value: number,
  referenceRanges: ReferenceRanges,
  gender?: 'male' | 'female' | 'ذكر' | 'أنثى',
  age?: number
): ResultFlag {
  // Determine which reference range to use
  let range: ReferenceRange | undefined;

  // Map Arabic gender to English for range lookup
  const canonicalGender = gender === 'ذكر' || gender === 'male' ? 'male' : 
                         gender === 'أنثى' || gender === 'female' ? 'female' : undefined;

  // Try age-specific range first
  if (age !== undefined && referenceRanges.age_ranges) {
    const ageRange = referenceRanges.age_ranges.find(
      (r) => age >= r.min_age && age <= r.max_age
    );
    if (ageRange) {
      range = { min: ageRange.min, max: ageRange.max };
    }
  }

  // Try gender-specific range
  if (!range && canonicalGender && referenceRanges[canonicalGender]) {
    range = referenceRanges[canonicalGender];
  }

  // Fall back to default range
  if (!range && referenceRanges.default) {
    range = referenceRanges.default;
  }

  // If no range found, return normal
  if (!range) {
    return 'normal';
  }

  // Calculate flag
  const { min, max } = range;

  // Critical thresholds (50% beyond normal range)
  const criticalLow = min - (max - min) * 0.5;
  const criticalHigh = max + (max - min) * 0.5;

  if (value < criticalLow) {
    return 'critical_low';
  } else if (value < min) {
    return 'low';
  } else if (value > criticalHigh) {
    return 'critical_high';
  } else if (value > max) {
    return 'high';
  } else {
    return 'normal';
  }
}

/**
 * Format reference range for display
 * @param referenceRanges - Reference ranges object
 * @param gender - Patient gender ('male' | 'female' | 'ذكر' | 'أنثى')
 * @param age - Patient age
 * @returns Formatted string like "70-100 mg/dL"
 */
export function formatReferenceRange(
  referenceRanges: ReferenceRanges,
  gender?: 'male' | 'female' | 'ذكر' | 'أنثى',
  age?: number
): string {
  let range: ReferenceRange | undefined;

  // Map Arabic gender to English for range lookup
  const canonicalGender = gender === 'ذكر' || gender === 'male' ? 'male' : 
                         gender === 'أنثى' || gender === 'female' ? 'female' : undefined;

  // Try age-specific range first
  if (age !== undefined && referenceRanges.age_ranges) {
    const ageRange = referenceRanges.age_ranges.find(
      (r) => age >= r.min_age && age <= r.max_age
    );
    if (ageRange) {
      range = { min: ageRange.min, max: ageRange.max };
    }
  }

  // Try gender-specific range
  if (!range && canonicalGender && referenceRanges[canonicalGender]) {
    range = referenceRanges[canonicalGender];
  }

  // Fall back to default range
  if (!range && referenceRanges.default) {
    range = referenceRanges.default;
  }

  if (!range) {
    return 'N/A';
  }

  return `${range.min} - ${range.max}`;
}

/**
 * Validate test value
 * @param value - Input value to validate
 * @param test - Lab test definition
 * @returns Object with isValid flag and error message
 */
export function validateTestValue(
  value: string,
  test: LabTest
): { isValid: boolean; error?: string } {
  // Empty value is valid (optional test)
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  // Check if numeric
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: 'يجب إدخال رقم صحيح' };
  }

  // Check if negative (most tests don't allow negative values)
  if (numValue < 0) {
    return { isValid: false, error: 'لا يمكن أن تكون القيمة سالبة' };
  }

  // Additional validation can be added here based on test type
  // For example, percentage values should be 0-100

  return { isValid: true };
}

/**
 * Get flag color for UI display
 * @param flag - Result flag
 * @returns Tailwind color class
 */
export function getFlagColor(flag: ResultFlag): string {
  switch (flag) {
    case 'normal':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'high':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'critical_high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'critical_low':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get flag icon for UI display
 * @param flag - Result flag
 * @returns Icon character or emoji
 */
export function getFlagIcon(flag: ResultFlag): string {
  switch (flag) {
    case 'normal':
      return '✓';
    case 'high':
      return '↑';
    case 'low':
      return '↓';
    case 'critical_high':
      return '⚠↑';
    case 'critical_low':
      return '⚠↓';
    default:
      return '';
  }
}

/**
 * Get flag label in Arabic
 * @param flag - Result flag
 * @returns Arabic label
 */
export function getFlagLabel(flag: ResultFlag): string {
  switch (flag) {
    case 'normal':
      return 'طبيعي';
    case 'high':
      return 'مرتفع';
    case 'low':
      return 'منخفض';
    case 'critical_high':
      return 'مرتفع جداً';
    case 'critical_low':
      return 'منخفض جداً';
    default:
      return '';
  }
}

/**
 * Group tests by category
 * @param tests - Array of lab tests
 * @returns Tests grouped by category
 */
export function groupTestsByCategory(tests: LabTest[]): GroupedTests {
  return tests.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as GroupedTests);
}

/**
 * Sort tests by display order
 * @param tests - Array of lab tests
 * @returns Sorted array
 */
export function sortTestsByOrder(tests: LabTest[]): LabTest[] {
  return [...tests].sort((a, b) => a.display_order - b.display_order);
}

/**
 * Parse numeric value from string (handles Arabic numerals)
 * @param value - String value to parse
 * @returns Parsed number or NaN
 */
export function parseTestValue(value: string): number {
  // Replace Arabic numerals with English
  const englishValue = value
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());

  return parseFloat(englishValue);
}

/**
 * Format test value for display
 * @param value - Numeric value
 * @param unit - Unit of measurement
 * @returns Formatted string
 */
export function formatTestValue(value: number | string, unit?: string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '-';
  }

  // Format with 2 decimal places if needed
  const formatted = numValue % 1 === 0
    ? numValue.toString()
    : numValue.toFixed(2);

  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Check if a test is in a group
 * @param testCode - Test code to check
 * @param groupTestCodes - Array of test codes in the group
 * @returns True if test is in group
 */
export function isTestInGroup(testCode: string, groupTestCodes: string[]): boolean {
  return groupTestCodes.includes(testCode);
}

/**
 * Get all tests from selected groups
 * @param selectedGroups - Array of selected group codes
 * @param allGroups - All available test groups
 * @returns Set of test codes
 */
export function getTestsFromGroups(
  selectedGroups: string[],
  allGroups: any[]
): Set<string> {
  const testCodes = new Set<string>();

  selectedGroups.forEach((groupCode) => {
    const group = allGroups.find((g) => g.group_code === groupCode);
    if (group) {
      group.test_codes.forEach((code: string) => testCodes.add(code));
    }
  });

  return testCodes;
}
