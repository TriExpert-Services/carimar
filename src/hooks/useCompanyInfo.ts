import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CompanyInfo } from '../types';

export const useCompanyInfo = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('company_info')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setCompanyInfo(data as CompanyInfo);
      }
    } catch (err) {
      console.error('Error loading company info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load company information');
    } finally {
      setLoading(false);
    }
  };

  return { companyInfo, loading, error, refetch: loadCompanyInfo };
};
