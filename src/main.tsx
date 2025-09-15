import { StrictMode } from "react";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ImmobilierProvider } from '@/contexts/ImmobilierContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { ColumnVisibilityProvider } from '@/contexts/ColumnVisibilityContext';
import { SearchProvider } from '@/contexts/SearchContext';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColumnVisibilityProvider>
      <CompanyProvider>
        <ImmobilierProvider>
          <SearchProvider>
            <App />
          </SearchProvider>
        </ImmobilierProvider>
      </CompanyProvider>
    </ColumnVisibilityProvider>
  </StrictMode>
);
