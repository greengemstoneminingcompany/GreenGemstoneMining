import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
import {useI18n} from '@/i18n/core';
type Theme='light'|'dark';
const key='ggmc-color-theme';
function initialTheme():Theme {
 try{const saved=localStorage.getItem(key);if(saved==='light'||saved==='dark')return saved;}catch{/* Storage may be unavailable in private browsing. */}
 return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
}
const labels={en:{dark:'Dark theme',light:'Light theme',switchDark:'Switch to dark theme',switchLight:'Switch to light theme'},so:{dark:'Muuqaal madow',light:'Muuqaal iftiin leh',switchDark:'U beddel muuqaal madow',switchLight:'U beddel muuqaal iftiin leh'},ar:{dark:'المظهر الداكن',light:'المظهر الفاتح',switchDark:'التبديل إلى المظهر الداكن',switchLight:'التبديل إلى المظهر الفاتح'},zh:{dark:'深色主题',light:'浅色主题',switchDark:'切换到深色主题',switchLight:'切换到浅色主题'}};
export default function ThemeSwitcher(){
 const [theme,setTheme]=useState<Theme>(initialTheme);const{lang}=useI18n();const text=labels[lang];
 useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;},[theme]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  const followSystem=()=>{try{if(localStorage.getItem(key))return;}catch{/* Continue with the system preference. */}setTheme(media.matches?'dark':'light');};
  const sync=(event:StorageEvent)=>{if(event.key===key)setTheme(event.newValue==='dark'?'dark':event.newValue==='light'?'light':media.matches?'dark':'light');};
  media.addEventListener('change',followSystem);window.addEventListener('storage',sync);
  return()=>{media.removeEventListener('change',followSystem);window.removeEventListener('storage',sync);};
 },[]);
 const toggle=()=>{const next=theme==='dark'?'light':'dark';setTheme(next);try{localStorage.setItem(key,next);}catch{/* Keep the current session usable without storage. */}};
 return <button type="button" className="theme-switch" onClick={toggle} aria-label={theme==='dark'?text.switchLight:text.switchDark} title={theme==='dark'?text.switchLight:text.switchDark}>{theme==='dark'?<Sun size={18} aria-hidden="true"/>:<Moon size={18} aria-hidden="true"/>}<span>{theme==='dark'?text.light:text.dark}</span></button>;
}
