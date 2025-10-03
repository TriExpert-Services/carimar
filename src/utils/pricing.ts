import { PropertyType, Frequency } from '../types';

export interface PricingCalculation {
  basePrice: number;
  sqftCharge: number;
  frequencyDiscount: number;
  subtotal: number;
  total: number;
  marketAverage: string;
  isCompetitive: boolean;
}

export const calculatePrice = (
  serviceType: string,
  propertyType: PropertyType,
  squareFootage: number,
  frequency: Frequency,
  basePrice: number,
  pricePerSqft: number
): PricingCalculation => {
  const sqftCharge = squareFootage * pricePerSqft;
  const subtotal = basePrice + sqftCharge;

  const frequencyDiscounts = {
    once: 0,
    weekly: 0.15,
    biweekly: 0.10,
    monthly: 0.05,
  };

  const discount = subtotal * frequencyDiscounts[frequency];
  const total = subtotal - discount;

  const marketRanges: Record<string, string> = {
    'Residential Cleaning': '$100-$400',
    'Commercial Cleaning': '$150-$1000',
    'Deep Cleaning': '$200-$600',
    'Post-Construction Cleaning': '$300-$1500',
    'Window Cleaning': '$80-$300',
    'Carpet Cleaning': '$120-$400',
    'Office Cleaning': '$500-$4000',
  };

  const marketAverage = marketRanges[serviceType] || '$100-$500';

  const avgMin = parseInt(marketAverage.split('-')[0].replace('$', ''));
  const avgMax = parseInt(marketAverage.split('-')[1].replace('$', ''));
  const avgMid = (avgMin + avgMax) / 2;

  const isCompetitive = total <= avgMid;

  return {
    basePrice,
    sqftCharge,
    frequencyDiscount: discount,
    subtotal,
    total,
    marketAverage,
    isCompetitive,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
