// ============================================================================
// LAB TEST RESULTS TYPES
// ============================================================================

/**
 * Reference range structure for test values
 * Can be gender-specific or age-specific
 */
export interface ReferenceRange {
  min: number;
  max: number;
}

export interface ReferenceRanges {
  default?: ReferenceRange;
  male?: ReferenceRange;
  female?: ReferenceRange;
  age_ranges?: Array<{
    min_age: number;
    max_age: number;
    min: number;
    max: number;
  }>;
}

/**
 * Lab Test Definition (Global - shared across all labs)
 */
export interface LabTest {
  uuid: string;
  test_code: string; // e.g., "CBC_WBC", "GLUC_FBS"
  test_name_ar: string;
  test_name_en: string;
  category: string; // e.g., "Hematology", "Diabetes"
  unit?: string; // e.g., "mg/dL", "×10³/µL"
  reference_ranges: ReferenceRanges;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Test Group/Panel Definition (Global - shared across all labs)
 */
export interface TestGroup {
  uuid: string;
  group_code: string; // e.g., "CBC_PANEL", "DIABETES_PANEL"
  group_name_ar: string;
  group_name_en: string;
  test_codes: string[]; // Array of test_code values
  is_predefined: boolean; // System groups vs custom groups
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Result flag indicating if value is normal/high/low
 */
export type ResultFlag = 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low';

/**
 * Individual test result value
 */
export interface TestResult {
  value: string | number;
  unit?: string;
  flag?: ResultFlag;
  notes?: string;
}

/**
 * Single result entry (one visit/test session)
 */
export interface ResultEntry {
  entry_id: string; // UUID for this entry
  recorded_at: string; // ISO timestamp
  recorded_by: string; // User UUID
  tests: Record<string, TestResult>; // test_code -> TestResult
  notes?: string; // Overall notes for this entry
}

/**
 * Complete results structure stored in clients.results JSONB
 */
export interface ClientResults {
  entries: ResultEntry[];
}

/**
 * Extended Client type with test results
 */
export interface ClientWithResults {
  uuid: string;
  patient_name: string;
  selected_tests: string[]; // Test codes selected during client creation
  results: ClientResults;
  // ... other client fields
}

/**
 * Test selection state (for UI)
 */
export interface TestSelection {
  selectedTests: Set<string>; // test_code values
  selectedGroups: Set<string>; // group_code values
}

/**
 * Grouped tests by category (for UI display)
 */
export interface GroupedTests {
  [category: string]: LabTest[];
}

/**
 * Test input form data
 */
export interface TestInputFormData {
  tests: Record<string, {
    value: string;
    notes?: string;
  }>;
  overall_notes?: string;
}

/**
 * Analytics data point for trend charts
 */
export interface TrendDataPoint {
  date: string; // ISO timestamp
  [test_code: string]: string | number; // Dynamic test values
}

/**
 * Category analytics summary
 */
export interface CategoryAnalytics {
  category: string;
  total_clients: number;
  clients_with_results: number;
  completion_rate: number;
  avg_tests_per_client: number;
  abnormal_results_count: number;
  abnormal_results_percentage: number;
  most_common_tests: Array<{
    test_code: string;
    test_name: string;
    count: number;
  }>;
}

/**
 * Export options
 */
export interface ExportOptions {
  format: 'excel' | 'pdf';
  date_range?: {
    start: string;
    end: string;
  };
  categories?: string[];
  include_charts?: boolean;
  include_reference_ranges?: boolean;
}
