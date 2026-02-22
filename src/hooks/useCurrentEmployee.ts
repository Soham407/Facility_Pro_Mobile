import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { Employee } from '../types/database';

export function useCurrentEmployee() {
  const user = useAuthStore((s) => s.user);

  return useQuery<Employee | null>({
    queryKey: ['currentEmployee', user?.employee_id],
    enabled: !!user?.employee_id,
    queryFn: async () => {
      if (!user?.employee_id) return null;

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', user.employee_id)
        .single();

      if (error) throw error;
      return data as Employee;
    },
    staleTime: 1000 * 60 * 10, // 10 min
  });
}
