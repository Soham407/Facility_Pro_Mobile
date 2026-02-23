import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Helper interface for returned data
export interface ClockedInGuard {
  employee_id: string;
  guard_id: string;
  guard_code: string;
  first_name: string;
  last_name: string;
  location_id: string;
  shift_id: string;
}

export interface GuardPosition {
  latitude: number;
  longitude: number;
  tracked_at: string;
  minutes_ago: number;
}

export function useSupervisorData() {
  return useQuery({
    queryKey: ['supervisorData'],
    refetchInterval: 60000,
    queryFn: async () => {
      // 1. Fetch clocked in guards
      const { data: guards, error: guardsError } = await supabase.rpc('get_clocked_in_guards');
      if (guardsError) throw guardsError;

      const clockedInGuards: ClockedInGuard[] = guards || [];
      const guardPositions = new Map<string, GuardPosition>();

      let complianceTotal = 0;
      let complianceCount = 0;

      // Ensure timezone matches today
      const today = new Date().toISOString().split('T')[0];

      // 2. Fetch positions and compliance per guard
      await Promise.all(
        clockedInGuards.map(async (guard) => {
          const { data: posData } = await supabase.rpc('get_guard_last_position', { p_guard_id: guard.guard_id });
          if (posData && posData.length > 0) {
            guardPositions.set(guard.guard_id, posData[0] as GuardPosition);
          }

          const { data: compData } = await supabase.rpc('get_guard_checklist_completion', { 
            p_guard_id: guard.guard_id, 
            p_checklist_date: today 
          });
          if (compData && compData.length > 0) {
            complianceTotal += (compData[0].completion_percentage || 0);
            complianceCount++;
          }
        })
      );

      const complianceAvg = complianceCount > 0 ? complianceTotal / complianceCount : 0;

      // 3. Fetch active alerts
      const { data: activeAlerts, error: alertsError } = await supabase
        .from('panic_alerts')
        .select(`
          *,
          security_guards!inner (
            guard_code,
            employees (first_name, last_name, photo_url)
          ),
          company_locations (location_name)
        `)
        .eq('is_resolved', false)
        .order('alert_time', { ascending: false });

      if (alertsError) throw alertsError;

      // 4. Fetch today stats
      // checkInCount
      const { count: checkInCount } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('log_date', today);

      // visitorCount
      const { count: visitorCount } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .gte('entry_time', `${today}T00:00:00Z`)
        .lte('entry_time', `${today}T23:59:59Z`);

      return {
        clockedInGuards,
        guardPositions,
        activeAlerts: activeAlerts || [],
        todayStats: {
          checkInCount: checkInCount || 0,
          visitorCount: visitorCount || 0,
          complianceAvg
        }
      };
    }
  });
}
