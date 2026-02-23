export type UserRole =
  | 'admin'
  | 'company_md'
  | 'company_hod'
  | 'account'
  | 'delivery_boy'
  | 'buyer'
  | 'supplier'
  | 'vendor'
  | 'security_guard'
  | 'security_supervisor'
  | 'society_manager'
  | 'service_boy'
  | 'resident';

export interface AppUser {
  id: string;
  employee_id: string | null;
  role_id: string;
  username: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  supplier_id: string | null;
}

export interface AppRole {
  id: string;
  role_name: UserRole;
  role_display_name: string;
  permissions: Record<string, boolean>;
}

export interface AuthState {
  user: AppUser | null;
  role: AppRole | null;
  session: { access_token: string; refresh_token: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
