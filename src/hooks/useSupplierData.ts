import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { ServiceRequest, PurchaseOrder, PurchaseBill } from '../types/database';

export function useSupplierData() {
  const user = useAuthStore((s) => s.user);
  const supplierId = user?.supplier_id;
  const queryClient = useQueryClient();

  const queryKeyIndent = ['supplier_indents', supplierId];
  const queryKeyActive = ['supplier_active_pos', supplierId];
  const queryKeyBills = ['supplier_bills', supplierId];

  // Inbox: indents awaiting response
  const { data: indents, isLoading: loadingIndents } = useQuery({
    queryKey: queryKeyIndent,
    enabled: !!supplierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          services (service_name),
          company_locations (location_name)
        `)
        .eq('supplier_id', supplierId)
        .eq('status', 'indent_forwarded')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
  });

  // Active POs
  const { data: activePOs, isLoading: loadingActive } = useQuery({
    queryKey: queryKeyActive,
    enabled: !!supplierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          services (service_name),
          company_locations (location_name),
          purchase_orders (
            po_number, total_amount, expected_delivery_date
          )
        `)
        .eq('supplier_id', supplierId)
        .in('status', ['indent_accepted', 'po_issued', 'po_received', 'po_dispatched'])
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
  });

  // Bills
  const { data: bills, isLoading: loadingBills, refetch: refetchBills } = useQuery({
    queryKey: queryKeyBills,
    enabled: !!supplierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_bills')
        .select(`
          *,
          purchase_orders (po_number)
        `)
        .eq('supplier_id', supplierId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
  });

  // Valid status updates for requests table
  const { mutateAsync: updateRequestStatus } = useMutation({
    mutationFn: async ({ requestId, newStatus, extraData = {} }: { requestId: string, newStatus: string, extraData?: any }) => {
      const { data, error } = await supabase
        .from('service_requests')
        .update({ status: newStatus, ...extraData })
        .eq('id', requestId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyIndent });
      queryClient.invalidateQueries({ queryKey: queryKeyActive });
    },
  });

  const { mutateAsync: submitBill } = useMutation({
    mutationFn: async (billData: Partial<PurchaseBill>) => {
      const { data, error } = await supabase
        .from('purchase_bills')
        .insert({
          ...billData,
          supplier_id: supplierId!,
          payment_status: 'pending',
          match_status: 'pending',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyBills });
    },
  });

  return {
    indents,
    activePOs,
    bills,
    isLoading: loadingIndents || loadingActive || loadingBills,
    refetchBills,
    acceptIndent: (id: string) => updateRequestStatus({ requestId: id, newStatus: 'indent_accepted' }),
    declineIndent: (id: string, reason: string) => updateRequestStatus({ requestId: id, newStatus: 'indent_rejected', extraData: { feedback_comment: reason } }), // Store reason in comment or another field
    confirmPOReceived: (id: string) => updateRequestStatus({ requestId: id, newStatus: 'po_received' }),
    markDispatched: (id: string, dispatchData: any) => updateRequestStatus({ requestId: id, newStatus: 'po_dispatched', extraData: { parts_used: [dispatchData] } }), // Hack dispatch data somewhere or just keep in status
    submitBill,
  };
}
