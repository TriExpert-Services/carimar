import { useState, useEffect } from 'react';
import { Building2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CompanyInfo } from '../types';

export const CompanySettings = () => {
  const [formData, setFormData] = useState<Partial<CompanyInfo>>({
    company_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    business_hours_en: '',
    business_hours_es: '',
    service_area_en: '',
    service_area_es: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData(data as CompanyInfo);
      }
    } catch (error) {
      console.error('Error loading company info:', error);
      setMessage({ type: 'error', text: 'Failed to load company information' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('company_info')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Company information updated successfully!' });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating company info:', error);
      setMessage({ type: 'error', text: 'Failed to update company information' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanyInfo, value: string) => {
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
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Settings</h2>
          <p className="text-gray-600">Manage your business information and contact details</p>
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

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                required
                value={formData.company_name || ''}
                onChange={(e) => handleChange('company_name', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                required
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  required
                  value={formData.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zip_code || ''}
                  onChange={(e) => handleChange('zip_code', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Business Hours & Service Area</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Hours (English)
              </label>
              <input
                type="text"
                required
                value={formData.business_hours_en || ''}
                onChange={(e) => handleChange('business_hours_en', e.target.value)}
                placeholder="Monday - Saturday: 8:00 AM - 6:00 PM"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Hours (Spanish)
              </label>
              <input
                type="text"
                required
                value={formData.business_hours_es || ''}
                onChange={(e) => handleChange('business_hours_es', e.target.value)}
                placeholder="Lunes - Sábado: 8:00 AM - 6:00 PM"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service Area (English)
              </label>
              <input
                type="text"
                required
                value={formData.service_area_en || ''}
                onChange={(e) => handleChange('service_area_en', e.target.value)}
                placeholder="Servicing Tampa, FL & Surrounding Areas"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service Area (Spanish)
              </label>
              <input
                type="text"
                required
                value={formData.service_area_es || ''}
                onChange={(e) => handleChange('service_area_es', e.target.value)}
                placeholder="Sirviendo Tampa, FL y Áreas Cercanas"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Social Media</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Facebook URL
              </label>
              <input
                type="url"
                value={formData.facebook_url || ''}
                onChange={(e) => handleChange('facebook_url', e.target.value)}
                placeholder="https://facebook.com/yourcompany"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instagram URL
              </label>
              <input
                type="url"
                value={formData.instagram_url || ''}
                onChange={(e) => handleChange('instagram_url', e.target.value)}
                placeholder="https://instagram.com/yourcompany"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Twitter URL
              </label>
              <input
                type="url"
                value={formData.twitter_url || ''}
                onChange={(e) => handleChange('twitter_url', e.target.value)}
                placeholder="https://twitter.com/yourcompany"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
