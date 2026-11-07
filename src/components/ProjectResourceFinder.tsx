import ProjectAssistant from '@/components/ProjectAssistant';
import { useState } from 'react';

const resources = [
 { title: 'Telluride Gold Project', href: '#/projects?section=telluride-project', terms: 'telluride gold location project status milestone geology', summary: 'Find the project overview, field media and project-specific enquiry.' },
 { title: 'Mining and Excavation', href: '#/gallery?album=241f9bd8-658c-50ce-8680-119f6fe4d438', terms: 'telluride excavation video field work media gallery', summary: 'View the company’s excavation video collection.' },
 { title: 'Buyer Information', href: '#/buyers', terms: 'partner investor due diligence technical purchasing offtake', summary: 'Find partnership enquiry paths and the diligence checklist.' },
 { title: 'Public documents', href: '#/buyers?section=public-documents', terms: 'report source document evidence brief download', summary: 'Open the public project document list and updates.' },
 { title: 'Mineral catalogue', href: '#/minerals', terms: 'minerals gemstone metals catalogue specifications', summary: 'Search the mineral catalogue and find map links.' },
];
const questions = [
 { title: 'Where can I see Telluride fieldwork?', answer: 'The project overview links to the company’s field collections.', href: '#/projects?section=telluride-project' },
 { title: 'How can I request a technical report, site visit, or management call?', answer: 'Choose the relevant request and identify the project in your enquiry.', href: '#/contact?project=Telluride%20Gold%20Project' },
 { title: 'What can potential partners discuss?', answer: 'Use the partnership links for investment, joint ventures, purchasing, or technical services.', href: '#/buyers?section=ways-to-partner' },
];

export default function ProjectResourceFinder() {
 const [query,setQuery]=useState('');
 const words=query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
 const matches=resources.map(item=>({item,score:words.filter(word=>word.length>2&&item.terms.includes(word)).length})).filter(match=>match.score>0).sort((a,b)=>b.score-a.score);
 return <section id="project-finder" className="sec"><div className="sec-container">
  <h2 className="display">Find project information</h2>
  <label>Search public projects and documents <input type="search" value={query} onChange={event=>setQuery(event.target.value)} maxLength={180}/></label>
  {query.trim()&&<p role="status">{matches.length ? `${matches.length} matching resources` : 'No matching public resource. Try a project name or contact the company.'}</p>}
  <ul>{(query.trim()?matches.map(match=>match.item):resources).map(item=><li key={item.href}><a href={item.href}>{item.title}</a><p>{item.summary}</p></li>)}</ul>
  {import.meta.env.VITE_GGMC_AI_PUBLIC_UI==='true'&&<ProjectAssistant />}
  <h3>Common questions</h3>
  {questions.map(item=><details key={item.title}><summary>{item.title}</summary><p>{item.answer} <a href={item.href}>Open the relevant page</a></p></details>)}
 </div></section>;
}
