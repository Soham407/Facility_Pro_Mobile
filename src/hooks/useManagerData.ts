import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useManagerData() {
  return useQuery({
    queryKey: ['managerData'],
    staleTime: 60000, // 60s
    queryFn: async () => {
      // openServiceRequests
      const { count: openServiceRequests } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("completed","cancelled")');

      // pendingLeaves
      const { data: pendingLeaves } = await supabase
        .from('leave_applications')
        .select(`
          *,
          employees (first_name, last_name, photo_url, employee_code, designation),
          leave_types (leave_type_name)
        `)
        .eq('status', 'pending');

      // expiringItems (Using RPC detect_expiring_items(7))
      const { data: expiringItemsData } = await supabase.rpc('detect_expiring_items', { days_ahead: 7 });
      const expiringItems = expiringItemsData?.length || 0;

      // recentActivity (mixed feed from last 24h)
      const { data: recentAlerts } = await supabase
        .from('panic_alerts')
        .select(`id, alert_type as title, description, alert_time as created_at, 'alert' as type`)
        .gte('alert_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(5);

      const { data: recentLeaves } = await supabase
        .from('leave_applications')
        .select(`id, reason as title, status as description, applied_at as created_at, 'leave' as type`)
        .gte('applied_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(5);

      const { data: recentServices } = await supabase
        .from('service_requests')
        .select(`id, status as title, description, created_at, 'service' as type`)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(5);

      // Combine and sort
      const combined = [
        ...(recentAlerts || []),
        ...(recentLeaves || []),
        ...(recentServices || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10); // Show last 10 items only

      return {
        openServiceRequests: openServiceRequests || 0,
        pendingLeaves: pendingLeaves || [],
        expiringItems,
        recentActivity: combined
      };
    }
  });
}
