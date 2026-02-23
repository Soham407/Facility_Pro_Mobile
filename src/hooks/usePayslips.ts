import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCurrentEmployee } from './useCurrentEmployee';

export function usePayslips() {
  const { data: currentEmployee } = useCurrentEmployee();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState({ 
    month: currentDate.getMonth() + 1, 
    year: currentDate.getFullYear() 
  });

  const { data: payslips, isLoading } = useQuery({
    queryKey: ['payslips', currentEmployee?.id],
    enabled: !!currentEmployee?.id,
    queryFn: async () => {
      // Last 12 months limit
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', currentEmployee!.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12);
        
      if (error) throw error;
      return data || [];
    }
  });

  const selectedPayslip = (payslips || []).find(
    (p) => p.month === selectedMonth.month && p.year === selectedMonth.year
  );

  return {
    payslips: payslips || [],
    selectedMonth,
    selectedPayslip,
    isLoading,
    selectMonth: (month: number, year: number) => setSelectedMonth({ month, year })
  };
}
