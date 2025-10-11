import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { CompanyInfo } from '../types';

interface CompanyContextType {
  companyInfo: CompanyInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
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

  return (
    <CompanyContext.Provider value={{ companyInfo, loading, error, refetch: loadCompanyInfo }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanyInfo = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanyInfo must be used within CompanyProvider');
  }
  return context;
};
