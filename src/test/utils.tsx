import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function
const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: TestWrapper, ...options });

// Mock data generators
export const createMockCashflow = (overrides = {}) => ({
  id: '1',
  date: '2023-01-01',
  rex: 1000,
  retraitAmort: 100,
  retraitAutres: 50,
  loyer: 1200,
  ...overrides,
});

export const createMockValorisation = (overrides = {}) => ({
  id: '1',
  date: '2023-01-01',
  valeur: 100000,
  note: 'Test valuation',
  ...overrides,
});

export const createMockDebtFlow = (overrides = {}) => ({
  id: '1',
  date: '2023-01-01',
  capitalDebut: 80000,
  rmbtCapital: 500,
  rmbtInteret: 300,
  ...overrides,
});

export const createMockImmobilisation = (overrides = {}) => ({
  id: '1',
  date: '2023-01-01',
  montant: 5000,
  note: 'Test immobilisation',
  ...overrides,
});

export const createMockInvestmentData = (overrides = {}) => ({
  cashflows: [createMockCashflow()],
  valorisations: [createMockValorisation()],
  debtFlows: [createMockDebtFlow()],
  immobilisations: [createMockImmobilisation()],
  ...overrides,
});

export * from '@testing-library/react';
export { customRender as render, screen };