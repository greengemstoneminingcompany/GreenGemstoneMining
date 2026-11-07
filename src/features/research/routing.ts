// All public sections now live on dedicated pages.
export const usesPageRoutes = true;
export const researchLink = (page: 'projects' | 'minerals' | 'about' | 'contact', section?: string) =>
  usesPageRoutes ? `#/${page}${section ? `?section=${encodeURIComponent(section)}` : ''}` : `#${section || (page === 'about' ? 'company' : page === 'minerals' ? 'resources' : page)}`;
