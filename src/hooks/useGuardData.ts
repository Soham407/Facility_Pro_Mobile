import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { SecurityGuard, AttendanceLog, CompanyLocation, Shift } from '../types/database';

export interface GuardData {
  securityGuard: SecurityGuard;
  todayAttendance: AttendanceLog | null;
  isCheckedIn: boolean;
  assignedLocation: CompanyLocation | null;
  currentShift: Shift | null;
}

export function useGuardData() {
  const user = useAuthStore((s) => s.user);

  return useQuery<GuardData | null>({
    queryKey: ['guard-data', user?.employee_id],
    enabled: !!user?.employee_id,
    queryFn: async () => {
      if (!user?.employee_id) return null;

      const today = new Date().toISOString().split('T')[0];

      // 1. Get security guard row
      const { data: guardData, error: guardError } = await supabase
        .from('security_guards')
        .select('*')
        .eq('employee_id', user.employee_id)
        .single();

      if (guardError || !guardData) {
        console.error('Failed to fetch security guard:', guardError);
        return null;
      }
      const securityGuard = guardData as SecurityGuard;

      // 2. Get today's attendance log
      const { data: attData } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', user.employee_id)
        .eq('log_date', today)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      const todayAttendance = attData ? (attData as AttendanceLog) : null;
      const isCheckedIn = !!todayAttendance && !todayAttendance.check_out_time;

      // 3. Get assigned location
      let assignedLocation: CompanyLocation | null = null;
      if (securityGuard.assigned_location_id) {
        const { data: locData } = await supabase
          .from('company_locations')
          .select('*')
          .eq('id', securityGuard.assigned_location_id)
          .single();
        if (locData) assignedLocation = locData as CompanyLocation;
      }

      // 4. Get active shift from employee_shift_assignments
      let currentShift: Shift | null = null;
      const { data: assignmentData } = await supabase
        .from('employee_shift_assignments')
        .select('shift_id')
        .eq('employee_id', user.employee_id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (assignmentData?.shift_id) {
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('*')
          .eq('id', assignmentData.shift_id)
          .single();
        if (shiftData) currentShift = shiftData as Shift;
      }

      return {
        securityGuard,
        todayAttendance,
        isCheckedIn,
        assignedLocation,
        currentShift,
      };
    },
    staleTime: 30 * 1000, // 30s
    refetchOnWindowFocus: true,
  });
}
