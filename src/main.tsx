import { StrictMode } from "react";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { InvestmentProvider } from './contexts/InvestmentContext.tsx';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InvestmentProvider>
      <App />
    </InvestmentProvider>
  </StrictMode>
);
