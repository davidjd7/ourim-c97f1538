// Global formatters for consistent financial data display
// These are optimized for performance and reusability across components

// Singleton instances to avoid recreation on every render
const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
});

const currencyFormatterWithDecimals = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Optimized formatters using cached instances
export const formatCurrency = (amount: number): string => {
  return currencyFormatter.format(amount);
};

export const formatCurrencyWithDecimals = (amount: number): string => {
  return currencyFormatterWithDecimals.format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatPercentageWithDecimals = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

// Utility for conditional sign display
export const formatCurrencyWithSign = (amount: number): string => {
  const formatted = formatCurrency(amount);
  return amount >= 0 ? `+${formatted}` : formatted;
};

export const formatPercentageWithSign = (value: number): string => {
  const formatted = formatPercentage(value);
  return value >= 0 ? `+${formatted}` : formatted;
};