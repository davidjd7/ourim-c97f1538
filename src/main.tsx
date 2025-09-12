import { StrictMode } from "react";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { InvestmentProvider } from '@/contexts/InvestmentContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { ColumnVisibilityProvider } from '@/contexts/ColumnVisibilityContext';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColumnVisibilityProvider>
      <CompanyProvider>
        <InvestmentProvider>
          <App />
        </InvestmentProvider>
      </CompanyProvider>
    </ColumnVisibilityProvider>
  </StrictMode>
);
