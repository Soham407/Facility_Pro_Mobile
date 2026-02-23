import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCurrentEmployee } from './useCurrentEmployee';
import { useAuthStore } from '../stores/authStore';

export function useLeave() {
  const queryClient = useQueryClient();
  const { data: currentEmployee } = useCurrentEmployee();
  const user = useAuthStore((s) => s.user);

  const { data: leaveTypes } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const { data } = await supabase.from('leave_types').select('*');
      return data || [];
    }
  });

  const { data: leaveHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['leaveHistory', currentEmployee?.id],
    enabled: !!currentEmployee?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('leave_applications')
        .select('*, leave_types (leave_type_name, max_days_per_year)')
        .eq('employee_id', currentEmployee!.id)
        .order('applied_at', { ascending: false });
      return data || [];
    }
  });

  const leaveBalance = (leaveTypes || []).map((type) => {
    const used = (leaveHistory || [])
      .filter((l) => l.leave_type_id === type.id && l.status === 'approved')
      .reduce((acc, curr) => acc + (curr.total_days || 0), 0);
      
    return {
      type: type.leave_type_name,
      typeId: type.id,
      used,
      max: type.max_days_per_year,
      remaining: Math.max(0, type.max_days_per_year - used)
    };
  });

  const submitLeave = useMutation({
    mutationFn: async (data: { leave_type_id: string; start_date: string; end_date: string; total_days: number; reason: string }) => {
      if (!currentEmployee) throw new Error('No employee context');
      const { error } = await supabase.from('leave_applications').insert({
        employee_id: currentEmployee.id,
        leave_type_id: data.leave_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        total_days: data.total_days,
        reason: data.reason,
        status: 'pending'
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaveHistory'] })
  });
  
  const approveLeave = useMutation({
    mutationFn: async (applicationId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('leave_applications').update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      }).eq('id', applicationId);
      if (error) throw error;
      
      // Edge function to send push notification
      supabase.functions.invoke('send-notification', {
        body: { type: 'leave_decision', result: 'approved', application_id: applicationId }
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['managerData'] })
  });

  const rejectLeave = useMutation({
    mutationFn: async (data: { applicationId: string; reason: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('leave_applications').update({
        status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: data.reason
      }).eq('id', data.applicationId);
      if (error) throw error;
      
      // Edge function to send push notification
      supabase.functions.invoke('send-notification', {
        body: { type: 'leave_decision', result: 'rejected', application_id: data.applicationId, reason: data.reason }
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['managerData'] })
  });

  return {
    leaveBalance,
    leaveTypes: leaveTypes || [],
    leaveHistory: leaveHistory || [],
    isLoadingHistory,
    submitLeave,
    approveLeave,
    rejectLeave
  };
}
