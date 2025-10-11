import { useState, useEffect } from 'react';
import { Calculator, CheckCircle, TrendingDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Service, PropertyType, Frequency, ChecklistFrequency } from '../types';
import { calculatePrice, formatCurrency, PricingCalculation } from '../utils/pricing';
import { saveQuoteChecklistSelections } from '../utils/checklistHelpers';
import { ChecklistSelector } from './ChecklistSelector';

interface QuoteFormProps {
  onNavigate: (section: string) => void;
}

export const QuoteForm = ({ onNavigate }: QuoteFormProps) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    serviceType: '',
    propertyType: 'residential' as PropertyType,
    squareFootage: '',
    bedrooms: '',
    bathrooms: '',
    frequency: 'once' as Frequency,
    preferredDate: '',
    preferredTime: '',
    name: user?.nombre || '',
    email: user?.email || '',
    phone: user?.telefono || '',
    address: user?.direccion || '',
    specialInstructions: '',
  });

  const [selectedChecklistItems, setSelectedChecklistItems] = useState<string[]>([]);
  const [calculation, setCalculation] = useState<PricingCalculation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.nombre || '',
        email: user.email || '',
        phone: user.telefono || '',
        address: user.direccion || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (formData.serviceType && formData.squareFootage) {
      calculateEstimate();
    }
  }, [formData.serviceType, formData.squareFootage, formData.frequency, formData.propertyType]);

  const loadServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: true });

    if (data) {
      setServices(data as Service[]);
    }
  };

  const calculateEstimate = () => {
    const service = services.find(s => {
      const name = language === 'en' ? s.nombre_en : s.nombre_es;
      return name === formData.serviceType;
    });

    if (!service) return;

    const sqft = parseInt(formData.squareFootage);
    if (isNaN(sqft) || sqft <= 0) return;

    const calc = calculatePrice(
      formData.serviceType,
      formData.propertyType,
      sqft,
      formData.frequency,
      service.precio_base,
      service.precio_por_sqft
    );

    setCalculation(calc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedChecklistItems.length === 0) {
      alert('Please select at least one service task from the checklist.');
      return;
    }

    setSubmitting(true);

    try {
      if (!calculation) {
        throw new Error('Please calculate your estimate first');
      }

      const quoteData = {
        user_id: user?.id || null,
        tipo_servicio: formData.serviceType,
        tipo_propiedad: formData.propertyType,
        metros_cuadrados: parseInt(formData.squareFootage),
        habitaciones: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        banos: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        frecuencia: formData.frequency,
        fecha_preferida: formData.preferredDate || null,
        hora_preferida: formData.preferredTime || null,
        precio_estimado: calculation.total,
        estado: 'pending',
        notas_cliente: formData.specialInstructions || null,
      };

      const { data: newQuote, error } = await supabase.from('quotes').insert(quoteData).select().single();

      if (error) throw error;

      if (newQuote && selectedChecklistItems.length > 0) {
        const selections = selectedChecklistItems.map(itemId => ({
          checklistItemId: itemId,
        }));
        await saveQuoteChecklistSelections(newQuote.id, selections);
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Error submitting quote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/20 via-teal-200/20 to-cyan-200/20 rounded-full blur-3xl"></div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[3rem] shadow-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('quote.success.title')}
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              {t('quote.success.message')}
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  ...formData,
                  serviceType: '',
                  squareFootage: '',
                  bedrooms: '',
                  bathrooms: '',
                  specialInstructions: '',
                });
                setCalculation(null);
                onNavigate('home');
              }}
              className="px-10 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-teal-500/50 transition-all"
            >
              {t('quote.success.continue')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-gradient-to-br from-purple-200/20 via-pink-200/20 to-rose-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-200/20 via-teal-200/20 to-cyan-200/20 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-4">
            {t('quote.title')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('quote.subtitle')}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[3rem] shadow-2xl p-10">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.serviceType')}
                  </label>
                  <select
                    required
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t('quote.form.selectService')}</option>
                    {services.map((service) => (
                      <option
                        key={service.id}
                        value={language === 'en' ? service.nombre_en : service.nombre_es}
                      >
                        {language === 'en' ? service.nombre_en : service.nombre_es}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.propertyType')}
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as PropertyType })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="residential">{t('quote.form.residential')}</option>
                    <option value="commercial">{t('quote.form.commercial')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.squareFootage')}
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={formData.squareFootage}
                    onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                    placeholder="2000"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                {formData.propertyType === 'residential' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('quote.form.bedrooms')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                        placeholder="3"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('quote.form.bathrooms')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                        placeholder="2"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.frequency')}
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Frequency })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="once">{t('quote.form.once')}</option>
                    <option value="weekly">{t('quote.form.weekly')}</option>
                    <option value="biweekly">{t('quote.form.biweekly')}</option>
                    <option value="monthly">{t('quote.form.monthly')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.preferredDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.preferredTime')}
                  </label>
                  <input
                    type="time"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.phone')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.address')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {formData.serviceType && formData.frequency && (
                <div className="mt-8">
                  <ChecklistSelector
                    serviceType={formData.serviceType}
                    frequency={formData.frequency as ChecklistFrequency}
                    selectedItems={selectedChecklistItems}
                    onSelectionChange={setSelectedChecklistItems}
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('quote.form.specialInstructions')}
                  </label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              {calculation && (
                <div className="mt-8 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>

                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center">
                      <Calculator className="w-7 h-7 text-white" />
                  </div>
                    <h3 className="text-2xl font-bold text-white">
                      {t('quote.estimate.title')}
                    </h3>
                  </div>

                  <div className="space-y-4 mb-6 relative z-10">
                    <div className="flex justify-between items-center pb-3 border-b border-white/20">
                      <span className="text-gray-300">{t('quote.estimate.basePrice')}</span>
                      <span className="font-semibold text-white">
                      {formatCurrency(calculation.basePrice)}
                    </span>
                  </div>

                    <div className="flex justify-between items-center pb-3 border-b border-white/20">
                      <span className="text-gray-300">{t('quote.estimate.sqftCharge')}</span>
                      <span className="font-semibold text-white">
                      {formatCurrency(calculation.sqftCharge)}
                    </span>
                  </div>

                    {calculation.frequencyDiscount > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b border-white/20">
                        <span className="text-emerald-400">{t('quote.estimate.frequencyDiscount')}</span>
                        <span className="font-semibold text-emerald-400">
                          -{formatCurrency(calculation.frequencyDiscount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3">
                      <span className="text-lg font-bold text-white">{t('quote.estimate.total')}</span>
                      <span className="text-3xl font-bold text-emerald-400">
                        {formatCurrency(calculation.total)}
                      </span>
                    </div>
                  </div>

                  {calculation.isCompetitive && (
                    <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-4 mb-4 relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-5 h-5 text-emerald-400" />
                        <span className="font-semibold text-emerald-300">
                          {t('quote.estimate.competitive')}
                        </span>
                      </div>
                      <p className="text-sm text-emerald-200">
                        {t('quote.estimate.marketAverage')}: {calculation.marketAverage}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 italic relative z-10">
                    {t('quote.estimate.note')}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !calculation}
                className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('quote.form.submitting') : t('quote.form.submit')}
              </button>
            </form>
        </div>
      </div>
    </section>
  );
};
