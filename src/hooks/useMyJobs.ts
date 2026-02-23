import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCurrentEmployee } from './useCurrentEmployee';
import type { ServiceRequest } from '../types/database';

export function useMyJobs(statusFilter?: string | string[]) {
  const { data: employee } = useCurrentEmployee();
  const queryClient = useQueryClient();

  const queryKey = ['myJobs', employee?.id, statusFilter];

  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey,
    enabled: !!employee?.id,
    queryFn: async () => {
      let q = supabase
        .from('service_requests')
        .select(`
          *,
          services (service_name, base_price),
          flats (flat_number, building_id),
          company_locations (location_name)
        `)
        .eq('assigned_to', employee!.id)
        .order('scheduled_date', { ascending: true });

      if (statusFilter) {
        if (Array.isArray(statusFilter)) {
          q = q.in('status', statusFilter);
        } else {
          q = q.eq('status', statusFilter);
        }
      }

      const { data, error: fetchError } = await q;

      if (fetchError) throw fetchError;
      return data as (ServiceRequest & {
        services?: { service_name: string; base_price: number };
        flats?: { flat_number: string; building_id: string };
        company_locations?: { location_name: string };
      })[];
    },
    staleTime: 1000 * 30, // 30s
    refetchOnWindowFocus: true,
  });

  const { mutateAsync: updateJobStatus } = useMutation({
    mutationFn: async ({
      requestId,
      newStatus,
      extraData = {},
    }: {
      requestId: string;
      newStatus: string;
      extraData?: Partial<ServiceRequest>;
    }) => {
      const { data, error: updateError } = await supabase
        .from('service_requests')
        .update({ status: newStatus, ...extraData })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    },
    onSuccess: () => {
      // Invalidate both generic and specific queries
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },
  });

  return { jobs, isLoading, error, refetch, updateJobStatus };
}
