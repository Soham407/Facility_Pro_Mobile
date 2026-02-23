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

export interface Shift {
  id: string;
  shift_code: string;
  shift_name: string;
  start_time: string;
  end_time: string;
}

export interface GuardPatrolLog {
  id: string;
  guard_id: string;
  patrol_start_time: string;
  patrol_end_time: string | null;
  checkpoints_verified: number;
  patrol_route: Record<string, unknown>[];
}

export interface ServiceRequest {
  id: string;
  request_number: string;
  requested_by: string;
  service_id: string;
  assigned_to: string | null;
  supplier_id: string | null;
  location_id: string | null;
  flat_id: string | null;
  status: string;
  priority: 'normal' | 'high' | 'urgent';
  description: string;
  quantity: number | null;
  unit: string | null;
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  delivery_proof_url: string | null;
  parts_used: Record<string, any>[] | null;
  feedback_rating: number | null;
  feedback_comment: string | null;
  feedback_submitted_at: string | null;
  estimated_amount: number | null;
  final_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  service_name: string;
  service_category: string;
  description: string | null;
  base_price: number | null;
  is_active: boolean;
}

export interface Product {
  id: string;
  product_name: string;
  product_code: string;
  category_id: string | null;
  unit_of_measure: string;
  current_stock: number;
  unit_price: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  request_id: string;
  status: string;
  total_amount: number;
  expected_delivery_date: string | null;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PurchaseBill {
  id: string;
  bill_number: string;
  supplier_id: string;
  po_id: string;
  total_amount: number;
  match_status: 'pending' | 'matched' | 'unmatched' | 'force_matched';
  payment_status: 'pending' | 'partial' | 'paid';
  bill_date: string;
  bill_document_url: string;
  submitted_at: string;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gst_number: string | null;
}

export interface Flat {
  id: string;
  flat_number: string;
  floor_number: string | null;
  building_id: string | null;
  flat_type: string | null;
}

export interface PestControlPPEVerification {
  id: string;
  employee_id: string;
  verified_at: string;
  mask_ok: boolean;
  gloves_ok: boolean;
  eye_protection_ok: boolean;
  apron_ok: boolean;
  verified_by_photo_url: string;
  shift_date: string;
}

export interface TechnicianProfile {
  id: string;
  employee_id: string;
  specialization: 'ac' | 'pest_control' | 'plumbing' | 'electrical' | 'general';
  certification_number: string | null;
  is_available: boolean;
}
