import { CompanyRecordsProvider } from './lib/companyRecords';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './i18n/LanguageProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <CompanyRecordsProvider><App /></CompanyRecordsProvider>
    </LanguageProvider>
  </StrictMode>
);
