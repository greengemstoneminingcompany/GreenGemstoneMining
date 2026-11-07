import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

type Enquiry = { id: string; name: string; email: string; company: string | null; interest: string; message: string; created_at: string };
const statuses = ['New', 'In progress', 'Follow up', 'Closed'] as const;
type Workflow = { lead_id: string; assignee: string; status: typeof statuses[number] };

export default function OwnerEnquiries({ client }: { client: SupabaseClient }) {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [workflow, setWorkflow] = useState<Record<string, Workflow>>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setNotice('');
      const { data, error } = await client.from('leads').select('id,name,email,company,interest,message,created_at').order('created_at', { ascending: false }).order('id').range(page * 50, page * 50 + 50);
      if (!active) return;
      if (error) { setRows([]); setNotice('Could not load enquiries.'); setLoading(false); return; }
      const list = (data ?? []).slice(0, 50) as Enquiry[];
      const result = list.length ? await client.from('lead_workflow').select('lead_id,assignee,status').in('lead_id', list.map(row => row.id)) : { data: [], error: null };
      if (!active) return;
      setRows(list);
      setHasMore((data ?? []).length > 50);
      setWorkflow(Object.fromEntries(((result.data ?? []) as Workflow[]).map(item => [item.lead_id, item])));
      if (result.error) setNotice('Follow-up records could not be loaded.');
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [client, page]);

  async function save(item: Workflow) {
    setSaving(item.lead_id);
    const { error } = await client.from('lead_workflow').upsert(item);
    setNotice(error ? 'Could not save the follow-up.' : 'Follow-up saved.');
    setSaving(null);
  }

  const query = search.trim().toLowerCase();
  const visible = rows.filter(row => [row.name, row.company, row.interest, row.message].some(value => value?.toLowerCase().includes(query)));
  return <section className="bw-panel">
    <h2>Enquiry inbox</h2>
    <label>Search this page <input value={search} onChange={event => setSearch(event.target.value)} /></label>
    {notice && <p role="status">{notice}</p>}
    {loading ? <p role="status">Loading enquiries…</p> : visible.length === 0 ? <p>No matching enquiries on this page.</p> :
      <ul>{visible.map(row => {
        const item = workflow[row.id] ?? { lead_id: row.id, assignee: '', status: 'New' };
        const edit = (patch: Partial<Workflow>) => setWorkflow(previous => ({ ...previous, [row.id]: { ...item, ...patch } }));
        return <li key={row.id}><details>
          <summary>{row.interest} · {row.company || row.name} · {new Date(row.created_at).toLocaleDateString()}</summary>
          <p><a href={`mailto:${row.email}`}>{row.email}</a></p><p style={{whiteSpace:'pre-wrap'}}>{row.message}</p>
          <label>Assigned to <input maxLength={120} value={item.assignee} onChange={event => edit({ assignee: event.target.value })} /></label>
          <label>Status <select value={item.status} onChange={event => edit({ status: event.target.value as Workflow['status'] })}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
          <button type="button" disabled={saving !== null} onClick={() => void save(item)}>Save follow-up</button>
        </details></li>;
      })}</ul>}
    <div className="gallery-nav-actions"><button type="button" disabled={page===0||loading} onClick={() => setPage(page-1)}>Previous</button><button type="button" disabled={!hasMore||loading} onClick={() => setPage(page+1)}>Next</button></div>
  </section>;
}
