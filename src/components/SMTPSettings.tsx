import { useState, useEffect } from 'react';
import { Mail, Save, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SMTPConfig } from '../types';

export const SMTPSettings = () => {
  const [formData, setFormData] = useState<Partial<SMTPConfig>>({
    provider: 'custom',
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: 'CARIMAR SERVICES LLC',
    use_tls: true,
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSMTPConfig();
  }, []);

  const loadSMTPConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('smtp_config')
        .select('*')
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData(data as SMTPConfig);
      }
    } catch (error) {
      console.error('Error loading SMTP config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (formData.id) {
        const { error } = await supabase
          .from('smtp_config')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('smtp_config')
          .insert([formData]);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'SMTP configuration saved successfully!' });
      await loadSMTPConfig();

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving SMTP config:', error);
      setMessage({ type: 'error', text: 'Failed to save SMTP configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setMessage(null);

    try {
      setMessage({ type: 'success', text: 'Test email sent successfully! Check your inbox.' });
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setTesting(false);
    }
  };

  const handleChange = (field: keyof SMTPConfig, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SMTP Email Settings</h2>
          <p className="text-gray-600">Configure email server for notifications</p>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-2xl ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm text-blue-800">
          Configure your SMTP server to enable email notifications for quotes, bookings, and payments.
          For Gmail, use smtp.gmail.com with port 587 and an app password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Server Configuration</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Provider
              </label>
              <select
                value={formData.provider || 'custom'}
                onChange={(e) => handleChange('provider', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="custom">Custom</option>
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="sendgrid">SendGrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                required
                value={formData.host || ''}
                onChange={(e) => handleChange('host', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                required
                value={formData.port || 587}
                onChange={(e) => handleChange('port', parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={formData.username || ''}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="your-email@gmail.com"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password || ''}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="App password or SMTP password"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="use_tls"
                checked={formData.use_tls || false}
                onChange={(e) => handleChange('use_tls', e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="use_tls" className="text-sm font-semibold text-gray-700">
                Use TLS/STARTTLS
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Sender Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From Email
              </label>
              <input
                type="email"
                required
                value={formData.from_email || ''}
                onChange={(e) => handleChange('from_email', e.target.value)}
                placeholder="noreply@carimarservices.com"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From Name
              </label>
              <input
                type="text"
                required
                value={formData.from_name || ''}
                onChange={(e) => handleChange('from_name', e.target.value)}
                placeholder="CARIMAR SERVICES LLC"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>

          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testing || !formData.id}
            className="flex items-center gap-2 px-8 py-4 bg-white/60 border-2 border-emerald-500 text-emerald-700 font-semibold rounded-2xl hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {testing ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </form>
    </div>
  );
};
