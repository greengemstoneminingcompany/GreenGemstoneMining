import { useState } from 'react';

type Source = { title: string; href: string };
type Result = { answer?: string; error?: string; sources?: Source[] };

export default function ProjectAssistant({ leadId, getToken }: { leadId?: string; getToken?: () => Promise<string | undefined> }) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask() {
    setBusy(true);
    setResult(null);
    try {
      const token = await getToken?.();
      const response = await fetch('/api/project-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify(leadId ? { mode: 'owner', leadId } : { mode: 'public', question }),
      });
      const payload: Result = await response.json();
      setResult(response.ok ? payload : { error: payload.error || 'The assistant is unavailable.' });
    } catch {
      setResult({ error: 'The assistant is unavailable.' });
    } finally {
      setBusy(false);
    }
  }

  return <details className="compact-details">
    <summary>{leadId ? 'Draft an enquiry reply' : 'Ask about our projects'}</summary>
    {!leadId && <label>Your question <input value={question} maxLength={500} onChange={event => setQuestion(event.target.value)} /></label>}
    <button type="button" disabled={busy || (!leadId && !question.trim())} onClick={() => void ask()}>{busy ? 'Working…' : leadId ? 'Generate draft' : 'Ask'}</button>
    <div aria-live="polite">
      {result?.error && <p>{result.error}</p>}
      {result?.answer && <p style={{ whiteSpace: 'pre-wrap' }}>{result.answer}</p>}
      {Boolean(result?.sources?.length) && <ul>{result?.sources?.map(source => <li key={source.href}><a href={source.href}>{source.title}</a></li>)}</ul>}
    </div>
  </details>;
}
