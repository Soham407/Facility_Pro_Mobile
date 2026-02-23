import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { ServiceRequest } from '../types/database';

export function useBuyerOrders() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const queryKey = ['buyerOrders', user?.id];

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('service_requests')
        .select(`
          *,
          services (service_name)
        `)
        .eq('requested_by', user!.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data as (ServiceRequest & {
        services?: { service_name: string };
      })[];
    },
    staleTime: 1000 * 60, // 60s
  });

  const { mutateAsync: submitOrder } = useMutation({
    mutationFn: async (orderData: Partial<ServiceRequest>) => {
      const { data, error: insertError } = await supabase
        .from('service_requests')
        .insert({
          ...orderData,
          requested_by: user!.id,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const { mutateAsync: submitFeedback } = useMutation({
    mutationFn: async ({
      requestId,
      rating,
      comment,
      currentStatus,
    }: {
      requestId: string;
      rating: number;
      comment: string;
      currentStatus: string;
    }) => {
      const { data, error: updateError } = await supabase
        .from('service_requests')
        .update({
          feedback_rating: rating,
          feedback_comment: comment,
          feedback_submitted_at: new Date().toISOString(),
          status: currentStatus === 'feedback_pending' ? 'completed' : currentStatus,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return { orders, isLoading, error, refetch, submitOrder, submitFeedback };
}
