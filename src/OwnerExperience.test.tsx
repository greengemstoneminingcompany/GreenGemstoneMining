// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import OwnerHome from '@/components/OwnerHome';
import OwnerTopicPage from '@/components/OwnerTopicPage';
import OwnerStudio from '@/components/OwnerStudio';
import { ownerCopy } from '@/components/ownerCopy';

afterEach(cleanup);

describe('Owner-led public experience', () => {
  it('keeps the six established editable home sections and relevant calls to action', () => {
    render(<OwnerHome uploads={[]} />);
    const ids=[...document.querySelectorAll('section[data-editor-id^="home."]')].map(node=>node.getAttribute('data-editor-id'));
    expect(ids).toEqual(['home.hero','home.company','home.resources','home.projects','home.gallery','home.contact']);
    expect(screen.getAllByRole('heading',{level:1})).toHaveLength(1);
    expect(document.querySelector('a[href="#/operations"]')).toBeTruthy();
    expect(document.querySelector('a[href="#/projects"]')).toBeTruthy();
  });
  it('has dedicated operations and responsibility pages', () => {
    const view=render(<OwnerTopicPage topic="operations" />);
    expect(screen.getByRole('heading',{level:1}).textContent).toContain('From the field');
    expect(document.querySelector('#operations')).toBeTruthy();
    view.unmount();
    render(<OwnerTopicPage topic="responsibility" />);
    expect(document.querySelector('#rural-development')).toBeTruthy();
    expect(screen.getByRole('heading',{level:1}).textContent).toContain('Responsible development');
  });
  it('provides navigation copy across all supported site languages',()=>{
    for(const code of ['en','so','ar','zh'] as const){const copy=ownerCopy(code);expect(copy.operations.trim()).not.toBe('');expect(copy.responsibility.trim()).not.toBe('');expect(copy.gallery.trim()).not.toBe('');}
  });
  it('does not open the owner controls without an enabled preview editor',()=>{
    render(<OwnerStudio uploads={[]} onOpenMedia={()=>undefined}/>);
    expect(screen.getByText(/Protected owner tools are unavailable/)).toBeTruthy();
    expect(screen.queryByText('Save draft')).toBeNull();
  });
});
