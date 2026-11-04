import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/core';

type Quote = { symbol: string; price: number; currency: string; unit: string; asOf: string; source: string; delayMinutes?: number };
type Feed = { quotes: Quote[] };
const isQuote = (q: unknown): q is Quote => {
  if (!q || typeof q !== 'object') return false;
  const x = q as Record<string, unknown>;
  return typeof x.symbol === 'string' && typeof x.price === 'number' && Number.isFinite(x.price) && x.price > 0
    && typeof x.currency === 'string' && typeof x.unit === 'string'
    && typeof x.source === 'string' && x.source.length > 0 && typeof x.asOf === 'string'
    && !Number.isNaN(Date.parse(x.asOf));
};
/** Quotes must be supplied by a licensed, same-origin server endpoint. No simulated values. */
export default function MarketReference({ minerals }: { minerals: readonly string[] }) {
  const { lang } = useI18n();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/market-prices', { signal: controller.signal, credentials: 'same-origin', cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Market data unavailable');
        const body: unknown = await res.json();
        if (!body || typeof body !== 'object' || !Array.isArray((body as Feed).quotes)) throw new Error('Invalid feed');
        return (body as Feed).quotes.filter(isQuote);
      })
      .then((valid) => {
        if (controller.signal.aborted) return;
        setQuotes(valid);
        setStatus(valid.length ? 'ready' : 'unavailable');
      })
      .catch(() => { if (!controller.signal.aborted) setStatus('unavailable'); });
    return () => controller.abort();
  }, []);
  const labels = {
    en: ['Market reference', 'Prices are sourced from verified feeds only. No indicative figures are invented.', 'Market feed not connected', 'Data pending', 'Source', 'As of'],
    zh: ['市场参考', '仅显示来自已核实数据源的价格，不使用模拟数据。', '市场数据尚未连接', '数据待更新', '来源', '截至'],
    so: ['Tixraaca suuqa', 'Qiimaha waxaa laga soo qaataa ilo la xaqiijiyay oo keliya; tirooyin lama male-awaalo.', 'Xogta suuqa lama xirin', 'Xog ayaa la sugayaa', 'Isha', 'Taariikhda'],
    ar: ['مرجع أسعار السوق', 'تُعرض الأسعار من مصادر موثقة فقط دون أرقام افتراضية.', 'مصدر بيانات السوق غير متصل', 'البيانات قيد الانتظار', 'المصدر', 'بتاريخ'],
  }[lang];
  const locale = { en: 'en', zh: 'zh-CN', so: 'so-SO', ar: 'ar' }[lang];
  return (
    <section className="sec atlas-market" aria-label={labels[0]} data-editor-id="home.market">
      <div className="sec-container">
        <p className="eyebrow">{labels[0]}</p>
        <h2 className="display">{labels[0]}</h2>
        <p className="body-text">{labels[1]}</p>
        <div className="atlas-market-grid">
          {minerals.map((name) => {
            const q = quotes.find((item) => item.symbol.toLowerCase() === name.toLowerCase());
            return <article className="atlas-market-item" key={name}>
              <h3>{name}</h3>
              {q && status === 'ready' ? <>
                <strong>{new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(q.price)} {q.currency}/{q.unit}</strong>
                <small>{labels[4]}: {q.source} · {labels[5]}: {new Date(q.asOf).toLocaleString(locale)}{typeof q.delayMinutes === 'number' && q.delayMinutes > 0 ? ` · +${q.delayMinutes} min` : ''}</small>
              </> : <p>{status === 'loading' ? labels[3] : labels[2]}</p>}
            </article>;
          })}
        </div>
      </div>
    </section>
  );
}
