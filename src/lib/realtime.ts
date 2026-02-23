import { supabase } from './supabase';

export function setupSupervisorRealtime(onNewAlert: (alert: any) => void) {
  return supabase.channel('supervisor-alerts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'panic_alerts'
    }, payload => {
      onNewAlert(payload.new);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Realtime connected for supervisor');
      } else if (status === 'CLOSED') {
        console.log('Realtime disconnected');
      }
    });
}

export function setupGuardRealtime(guardId: string, onAlertResolved: () => void) {
  return supabase.channel(`guard-${guardId}-alerts`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'panic_alerts',
      filter: `guard_id=eq.${guardId}`
    }, payload => {
      if (payload.new.is_resolved) {
        onAlertResolved();
      }
    })
    .subscribe();
}
