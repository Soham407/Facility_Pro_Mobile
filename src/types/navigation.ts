import type { UserRole } from './auth';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
};

// Guard Tabs
export type GuardTabParamList = {
  Home: undefined;
  Patrol: undefined;
  Visitors: undefined;
  Checklist: undefined;
  SOS: undefined;
};

// Supervisor Tabs
export type SupervisorTabParamList = {
  Dashboard: undefined;
  Guards: undefined;
  Alerts: undefined;
  Reports: undefined;
};

// Manager Tabs
export type ManagerTabParamList = {
  Overview: undefined;
  Service: undefined;
  Complaints: undefined;
  Visitors: undefined;
};

// Technician / Service Boy Tabs
export type TechnicianTabParamList = {
  MyJobs: undefined;
  StartJob: undefined;
  History: undefined;
};

// Delivery Boy Tabs
export type DeliveryTabParamList = {
  Deliveries: undefined;
  Scanner: undefined;
  History: undefined;
};

// Buyer / Resident Tabs
export type BuyerTabParamList = {
  Requests: undefined;
  Track: undefined;
  Feedback: undefined;
};

// Supplier Tabs
export type SupplierTabParamList = {
  Inbox: undefined;
  Active: undefined;
  History: undefined;
  Billing: undefined;
};

// Admin / MD / HOD Tabs
export type AdminTabParamList = {
  Dashboard: undefined;
  Staff: undefined;
  Finance: undefined;
  Settings: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  MainApp: undefined;
};

// Role to navigator key mapping
export const ROLE_NAVIGATOR_MAP: Record<UserRole, string> = {
  security_guard: 'Guard',
  security_supervisor: 'Supervisor',
  society_manager: 'Manager',
  service_boy: 'Technician',
  delivery_boy: 'Delivery',
  buyer: 'Buyer',
  resident: 'Buyer',
  supplier: 'Supplier',
  vendor: 'Supplier',
  admin: 'Admin',
  company_md: 'Admin',
  company_hod: 'Admin',
  account: 'Admin',
};
