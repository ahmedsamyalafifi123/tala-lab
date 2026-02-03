import { UserRole } from "./roles";

export interface User {
  id: string;
  email: string;
  role?: UserRole;
  labId?: string;
  labSlug?: string;
  isManager?: boolean;
}

export interface Lab {
  uuid: string;
  slug: string;
  name: string;
  name_en?: string;
  logo_url?: string;
  status: "active" | "suspended" | "inactive";
  created_at: string;
  settings?: Record<string, any>;
}

export interface LabUser {
  uuid: string;
  lab_id: string;
  user_id: string;
  role: UserRole;
  is_manager: boolean;
  status: string;
  lab?: Lab;
}

export interface Client {
  uuid: string;
  lab_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: "male" | "female";
  daily_id: number;
  daily_date: Date;
  results: Record<string, any>;
  categories: string[];
  primary_category?: string; // The primary category used for numbering
  client_group_id?: string; // Links multiple category copies together
  created_at: string;
  updated_at: string;
  notes?: string; // Kept for compatibility if needed, though not in strict plan schema but was in old one
}

export interface Category {
  id: string;  // Database uses 'id' not 'uuid'
  lab_id: string;
  name: string;
  name_en?: string;
  tests: any[];
  display_order: number;
  is_active: boolean;
}
