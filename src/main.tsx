import { Component, StrictMode, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import BuyerConcept from './concept/BuyerConcept';
import './index.css';
import './approved-design.css';
import './company-pages.css';
import './showcase-design.css';
import { LanguageProvider } from './i18n/LanguageProvider';
import { applyPublishedVisualEditorPayload, installVisualEditorBridge } from './lib/visualEditorBridge';
import { CompanyRecordsProvider, defaultCompanyRecords } from './lib/companyRecords';

const classicMode = new URLSearchParams(window.location.search).get('classic') === '1';
installVisualEditorBridge();
window.__GGMC_COMPANY_DEFAULT_RECORDS__ = JSON.parse(JSON.stringify(defaultCompanyRecords));

class PreviewRenderErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Green Gemstone preview render error]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main
          role="alert"
          style={{
            minHeight: '100vh',
            padding: '48px 24px',
            background: '#070a08',
            color: '#f2eee4',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ color: '#e4c87c', marginBottom: '16px' }}>The preview could not render</h1>
          <p style={{ maxWidth: '720px', lineHeight: 1.6 }}>
            The page encountered a rendering error. Please reload the page or try again later.
          </p>
          <pre
            style={{
              marginTop: '24px',
              padding: '16px',
              maxWidth: '900px',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              background: '#111a15',
              border: '1px solid #7a5f2c',
              borderRadius: '8px',
              color: '#f2eee4',
            }}
          >
            {import.meta.env.DEV ? this.state.error.message : 'An unexpected rendering error occurred.'}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 16px',
              borderRadius: '6px',
              background: '#c4a252',
              color: '#070a08',
              cursor: 'pointer',
            }}
          >
            Reload preview
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

function PublishedEditorContent() {
  useEffect(() => {
    let cancelled = false;
    void window.__GGMC_EDITOR_API__?.getPublishedPayload().then((payload) => {
      if (!cancelled) applyPublishedVisualEditorPayload(payload);
    }).catch((error: unknown) => {
      console.warn('[Published editor content unavailable]', error);
    });
    return () => { cancelled = true; };
  }, []);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreviewRenderErrorBoundary>
      <LanguageProvider>
        <CompanyRecordsProvider>
          {classicMode ? <App /> : <BuyerConcept />}
          {classicMode && <PublishedEditorContent />}
        </CompanyRecordsProvider>
      </LanguageProvider>
    </PreviewRenderErrorBoundary>
  </StrictMode>
);
