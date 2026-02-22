export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_joining: string;
  designation_id: string | null;
  department: string | null;
  reporting_to: string | null;
  is_active: boolean;
  photo_url: string | null;
  auth_user_id: string | null;
}

export interface SecurityGuard {
  id: string;
  employee_id: string;
  guard_code: string;
  grade: 'A' | 'B' | 'C' | 'D';
  is_armed: boolean;
  assigned_location_id: string | null;
  shift_timing: string | null;
}

export interface AttendanceLog {
  id: string;
  employee_id: string;
  log_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_selfie_url: string | null;
  is_auto_punch_out: boolean;
  status: string | null;
  total_hours: number | null;
}

export interface PanicAlert {
  id: string;
  guard_id: string;
  alert_type: 'panic' | 'inactivity' | 'geo_fence_breach' | 'checklist_incomplete' | 'routine';
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  alert_time: string;
}

export interface Visitor {
  id: string;
  visitor_name: string;
  visitor_type: string | null;
  phone: string | null;
  vehicle_number: string | null;
  photo_url: string | null;
  flat_id: string | null;
  entry_time: string;
  exit_time: string | null;
  entry_guard_id: string | null;
  approved_by_resident: boolean | null;
  is_frequent_visitor: boolean;
}

export interface ChecklistResponse {
  id: string;
  checklist_id: string;
  employee_id: string;
  response_date: string;
  responses: Record<string, unknown>[];
  is_complete: boolean;
  submitted_at: string;
}

export interface CompanyLocation {
  id: string;
  location_code: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  geo_fence_radius: number | null;
}
