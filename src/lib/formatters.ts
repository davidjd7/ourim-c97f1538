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

// Utility for file size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Utility for relative time formatting
export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`;
  } else if (diffInHours < 24 * 7) {
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
  } else {
    return date.toLocaleDateString('fr-FR');
  }
};