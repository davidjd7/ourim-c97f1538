import { StrictMode } from "react";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { InvestmentProvider } from './contexts/InvestmentContext.tsx';
import { CompanyProvider } from './contexts/CompanyContext.tsx';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CompanyProvider>
      <InvestmentProvider>
        <App />
      </InvestmentProvider>
    </CompanyProvider>
  </StrictMode>
);
