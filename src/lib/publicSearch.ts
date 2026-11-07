const normal=(value:string)=>value.normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase().trim();
export function matchesPublicSearch(query:string,...labels:string[]){const text=normal(labels.join(' '));return normal(query).split(/\s+/).every(term=>text.includes(term));}
