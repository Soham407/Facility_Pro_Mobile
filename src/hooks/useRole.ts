import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types/auth';

export function useRole() {
  const role = useAuthStore((s) => s.role);

  const roleName = role?.role_name ?? null;

  const is = (r: UserRole): boolean => roleName === r;
  const isAnyOf = (...roles: UserRole[]): boolean =>
    roleName !== null && roles.includes(roleName);

  const isGuard = roleName === 'security_guard';
  const isSupervisor = roleName === 'security_supervisor';
  const isManager = roleName === 'society_manager';
  const isAdmin = isAnyOf('admin', 'company_md', 'company_hod', 'account');
  const isTechnician = roleName === 'service_boy';
  const isDelivery = roleName === 'delivery_boy';
  const isBuyerOrResident = isAnyOf('buyer', 'resident', 'supplier', 'vendor');

  return {
    roleName,
    is,
    isAnyOf,
    isGuard,
    isSupervisor,
    isManager,
    isAdmin,
    isTechnician,
    isDelivery,
    isBuyerOrResident,
  };
}
