import { useState, useEffect } from 'react';
import { FileText, Download, Printer, Eye, DollarSign, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { downloadInvoice, printInvoice, generateInvoiceHTML } from '../utils/invoiceGenerator';

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  payment_date: string | null;
  order: {
    id: string;
    service_type: string;
    service_address: string;
    service_date: string;
    client: {
      nombre: string;
      email: string;
    };
  };
}

export const InvoiceManager = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [user]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('invoices')
        .select(`
          *,
          order:orders(
            id,
            service_type,
            service_address,
            service_date,
            client:users(nombre, email),
            order_items(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (user?.role === 'client') {
        query = query.eq('client_id', user.id);
      }

      const { data, error } = await query;

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

  const handlePrint = async (invoiceId: string) => {
    try {
      await printInvoice(invoiceId);
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Failed to print invoice');
    }
  };

  const handlePreview = async (invoice: Invoice) => {
    try {
      setSelectedInvoice(invoice);
      const { data: companyInfo } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      const html = generateInvoiceHTML({
        invoice_number: invoice.invoice_number,
        issue_date: new Date(invoice.issue_date).toLocaleDateString(),
        due_date: new Date(invoice.due_date).toLocaleDateString(),
        client_name: invoice.order.client.nombre,
        client_email: invoice.order.client.email,
        client_address: invoice.order.service_address,
        service_address: invoice.order.service_address,
        items: invoice.order.order_items?.map((item: any) => ({
          service_name: item.service_name,
          description: item.description || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })) || [],
        subtotal: invoice.subtotal,
        tax_rate: invoice.tax_rate,
        tax_amount: invoice.tax_amount,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'sent':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Invoices
          </h1>
          <p className="text-gray-600 mt-2">View and manage your invoices</p>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Invoices Yet</h3>
            <p className="text-gray-600">Invoices will appear here once orders are completed.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{invoice.invoice_number}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>

                    {user?.role !== 'client' && (
                      <p className="text-gray-600 mb-2">
                        <strong>Client:</strong> {invoice.order.client.nombre} ({invoice.order.client.email})
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Service:</strong> {invoice.order.service_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Address:</strong> {invoice.order.service_address}
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
                    <button
                      onClick={() => handlePrint(invoice.id)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Print"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Invoice Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <XCircle className="w-6 h-6" />
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
    </div>
  );
};
