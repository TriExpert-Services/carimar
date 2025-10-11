import { supabase } from '../lib/supabase';

interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  client_name: string;
  client_email: string;
  client_address: string;
  service_address: string;
  items: Array<{
    service_name: string;
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  notes?: string;
}

export async function generateInvoicePDF(invoiceId: string): Promise<Blob> {
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      order:orders(
        *,
        client:users(nombre, email, telefono),
        order_items(*)
      )
    `)
    .eq('id', invoiceId)
    .single();

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const { data: companyInfo } = await supabase
    .from('company_settings')
    .select('*')
    .single();

  const invoiceData: InvoiceData = {
    invoice_number: invoice.invoice_number,
    issue_date: new Date(invoice.issue_date).toLocaleDateString(),
    due_date: new Date(invoice.due_date).toLocaleDateString(),
    client_name: invoice.order.client.nombre,
    client_email: invoice.order.client.email,
    client_address: invoice.order.service_address,
    service_address: invoice.order.service_address,
    items: invoice.order.order_items.map((item: any) => ({
      service_name: item.service_name,
      description: item.description || '',
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    })),
    subtotal: invoice.subtotal,
    tax_rate: invoice.tax_rate,
    tax_amount: invoice.tax_amount,
    total_amount: invoice.total_amount,
    company_name: companyInfo?.company_name || 'Company Name',
    company_address: `${companyInfo?.city}, ${companyInfo?.state}`,
    company_phone: companyInfo?.phone || '',
    company_email: companyInfo?.email || '',
    notes: invoice.notes,
  };

  const html = generateInvoiceHTML(invoiceData);
  return new Blob([html], { type: 'text/html' });
}

export function generateInvoiceHTML(data: InvoiceData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoice_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
    }
    .invoice-container {
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #0ea5e9;
    }
    .company-info {
      flex: 1;
    }
    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #0ea5e9;
      margin-bottom: 10px;
    }
    .invoice-title {
      text-align: right;
      flex: 1;
    }
    .invoice-title h1 {
      font-size: 36px;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 18px;
      color: #666;
    }
    .details-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    .detail-box h3 {
      font-size: 14px;
      color: #0ea5e9;
      text-transform: uppercase;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .detail-box p {
      margin: 5px 0;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background: #0ea5e9;
      color: white;
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }
    .totals-row.subtotal {
      border-top: 1px solid #ddd;
    }
    .totals-row.total {
      border-top: 2px solid #333;
      font-size: 18px;
      font-weight: bold;
      color: #0ea5e9;
      margin-top: 10px;
      padding-top: 15px;
    }
    .notes {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .notes h3 {
      font-size: 14px;
      color: #0ea5e9;
      margin-bottom: 10px;
    }
    .notes p {
      font-size: 14px;
      color: #666;
      line-height: 1.8;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .invoice-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <div class="company-name">${data.company_name}</div>
        <p>${data.company_address}</p>
        <p>${data.company_phone}</p>
        <p>${data.company_email}</p>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="invoice-number">${data.invoice_number}</div>
      </div>
    </div>

    <div class="details-section">
      <div class="detail-box">
        <h3>Bill To</h3>
        <p><strong>${data.client_name}</strong></p>
        <p>${data.client_email}</p>
        <p>${data.client_address}</p>
      </div>
      <div class="detail-box">
        <h3>Invoice Details</h3>
        <p><strong>Issue Date:</strong> ${data.issue_date}</p>
        <p><strong>Due Date:</strong> ${data.due_date}</p>
        <p><strong>Service Address:</strong> ${data.service_address}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
          <tr>
            <td><strong>${item.service_name}</strong></td>
            <td>${item.description}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">$${item.unit_price.toFixed(2)}</td>
            <td class="text-right">$${item.subtotal.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row subtotal">
        <span>Subtotal:</span>
        <span>$${data.subtotal.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>Tax (${data.tax_rate}%):</span>
        <span>$${data.tax_amount.toFixed(2)}</span>
      </div>
      <div class="totals-row total">
        <span>Total:</span>
        <span>$${data.total_amount.toFixed(2)}</span>
      </div>
    </div>

    ${data.notes ? `
      <div class="notes">
        <h3>Notes</h3>
        <p>${data.notes}</p>
      </div>
    ` : ''}

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>For questions about this invoice, please contact ${data.company_email}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function downloadInvoice(invoiceId: string) {
  const blob = await generateInvoicePDF(invoiceId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${invoiceId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function printInvoice(invoiceId: string) {
  const blob = await generateInvoicePDF(invoiceId);
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 100);
  };
}
