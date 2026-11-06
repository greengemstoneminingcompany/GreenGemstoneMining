// Preview's single-page layout uses section anchors; the feature branches use real site routes.
export const usesPageRoutes = false;
export const researchLink = (page: 'projects' | 'minerals' | 'about' | 'contact', section?: string) =>
  usesPageRoutes ? `#/${page}${section ? `?section=${encodeURIComponent(section)}` : ''}` : `#${section || (page === 'about' ? 'company' : page === 'minerals' ? 'resources' : page)}`;
