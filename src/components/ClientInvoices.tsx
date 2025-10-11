import { useState, useEffect } from 'react';
import { FileText, Download, Eye, DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { downloadInvoice, generateInvoiceHTML } from '../utils/invoiceGenerator';

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: string;
  payment_date: string | null;
  order: {
    service_type: string;
    service_address: string;
  };
}

export const ClientInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user]);

  const loadInvoices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          order:orders(
            service_type,
            service_address,
            order_items(*)
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      await downloadInvoice(invoiceId);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    }
  };

  const handlePreview = async (invoice: Invoice) => {
    try {
      const { data: companyInfo } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      const { data: userData } = await supabase
        .from('users')
        .select('nombre, email')
        .eq('id', user!.id)
        .single();

      const html = generateInvoiceHTML({
        invoice_number: invoice.invoice_number,
        issue_date: new Date(invoice.issue_date).toLocaleDateString(),
        due_date: new Date(invoice.due_date).toLocaleDateString(),
        client_name: userData?.nombre || '',
        client_email: userData?.email || '',
        client_address: invoice.order.service_address,
        service_address: invoice.order.service_address,
        items: invoice.order.order_items?.map((item: any) => ({
          service_name: item.service_name,
          description: item.description || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })) || [],
        subtotal: invoice.total_amount,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: invoice.total_amount,
        company_name: companyInfo?.company_name || 'Company Name',
        company_address: `${companyInfo?.city}, ${companyInfo?.state}`,
        company_phone: companyInfo?.phone || '',
        company_email: companyInfo?.email || '',
      });

      setPreviewHTML(html);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Invoices Yet</h3>
        <p className="text-gray-600">Your invoices will appear here once services are completed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-bold text-gray-900">{invoice.invoice_number}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    <strong>Issued:</strong> {new Date(invoice.issue_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    <strong>Due:</strong> {new Date(invoice.due_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">
                    <strong>Amount:</strong> ${invoice.total_amount.toFixed(2)}
                  </span>
                </div>
                {invoice.payment_date && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">
                      <strong>Paid:</strong> {new Date(invoice.payment_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Service:</strong> {invoice.order.service_type}
                </p>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handlePreview(invoice)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Preview"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDownload(invoice.id)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Invoice Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <iframe
                srcDoc={previewHTML}
                className="w-full h-[600px] border border-gray-200 rounded-lg"
                title="Invoice Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
