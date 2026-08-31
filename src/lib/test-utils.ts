// ============================================================================
// LAB TEST UTILITY FUNCTIONS
// ============================================================================

import type { ResultFlag, LabTest, GroupedTests } from '@/types/results';

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
 * Get flag label in English
 * @param flag - Result flag
 * @returns English label
 */
export function getFlagLabel(flag: ResultFlag): string {
  switch (flag) {
    case 'normal':
      return 'Normal';
    case 'high':
      return 'High';
    case 'low':
      return 'Low';
    case 'critical_high':
      return 'Critical High';
    case 'critical_low':
      return 'Critical Low';
    default:
      return '';
  }
}

/**
 * Group tests by category
 * @param tests - Array of lab tests
 * @param categoryOrder - Optional lab-test-categories to order the groups by
 *   their display_order. Categories not present fall back to the end.
 * @returns Tests grouped by category
 */
export function groupTestsByCategory(
  tests: LabTest[],
  categoryOrder?: Array<{ value: string; display_order: number }>
): GroupedTests {
  const grouped = tests.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as GroupedTests);

  if (!categoryOrder?.length) return grouped;

  const orderOf = new Map(categoryOrder.map((c) => [c.value, c.display_order]));
  const ordered: GroupedTests = {};
  Object.keys(grouped)
    .sort((a, b) => (orderOf.get(a) ?? Infinity) - (orderOf.get(b) ?? Infinity))
    .forEach((cat) => {
      ordered[cat] = grouped[cat];
    });
  return ordered;
}

/**
 * Sort tests by display order
 * @param tests - Array of lab tests
 * @returns Sorted array
 */
export function sortTestsByOrder(tests: LabTest[]): LabTest[] {
  return [...tests].sort(
    (a, b) => a.display_order - b.display_order || a.uuid.localeCompare(b.uuid)
  );
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
