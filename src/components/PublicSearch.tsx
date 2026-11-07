import {useId,useRef} from 'react';
import {Search, X} from 'lucide-react';
import {useI18n} from '@/i18n/core';
const copy={en:{clear:'Clear search',matches:'Matches',empty:'No matching results.'},so:{clear:'Tirtir raadinta',matches:'Natiijooyin',empty:'Wax u dhigma lama helin.'},ar:{clear:'مسح البحث',matches:'النتائج',empty:'لا توجد نتائج مطابقة.'},zh:{clear:'清除搜索',matches:'匹配结果',empty:'没有匹配的结果。'}};
export default function PublicSearch({label,value,onChange,count}:{label:string;value:string;onChange:(value:string)=>void;count:number}){
 const id=useId();const input=useRef<HTMLInputElement>(null);const{lang}=useI18n();const t=copy[lang];
 return <div className="public-search"><label htmlFor={id}>{label}</label><div className="public-search-input"><Search size={18} aria-hidden="true"/><input ref={input} id={id} type="search" value={value} onChange={event=>onChange(event.target.value)} maxLength={120}/>{value&&<button type="button" aria-label={t.clear} title={t.clear} onClick={()=>{onChange('');input.current?.focus();}}><X size={18} aria-hidden="true"/></button>}</div><p role="status">{value.trim()?(count?`${t.matches}: ${count}`:t.empty):''}</p></div>;
}
