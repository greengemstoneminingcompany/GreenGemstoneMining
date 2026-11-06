// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import BuyerConcept from './BuyerConcept';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.location.hash = '';
});

describe('Buyer-ready GGMC concept', () => {
  it('shows a public company introduction without presenting reserves as verified', () => {
    render(<BuyerConcept/>);
    expect(screen.getByRole('heading', {level:1}).textContent).toContain('grounded view');
    expect(screen.getByText('Not the live production website')).toBeTruthy();
    expect(screen.getByText(/Not proven mineral inventory/i)).toBeTruthy();
    expect(screen.getByText(/not reserve estimates/i)).toBeTruthy();
  });

  it('offers a no-code studio and edits the homepage headline in a preview', () => {
    render(<BuyerConcept/>);
    fireEvent.click(screen.getAllByRole('button', {name:/owner studio/i})[0]);
    expect(screen.getByRole('dialog', {name:/GGMC STUDIO/i})).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name:'Page editor'}));
    const heading = screen.getByLabelText('Main headline') as HTMLInputElement;
    fireEvent.change(heading, {target:{value:'A new editorial direction'}});
    expect(heading.value).toBe('A new editorial direction');
    expect(screen.getAllByText('A new editorial direction').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', {name:'Mobile preview'}));
    expect(document.querySelector('.bc-studio-preview.mobile')).toBeTruthy();
  });

  it('prevents unauthenticated live publication from the concept studio', () => {
    render(<BuyerConcept/>);
    fireEvent.click(screen.getAllByRole('button', {name:/owner studio/i})[0]);
    fireEvent.click(screen.getByRole('button', {name:'Publishing'}));
    const publish = screen.getByRole('button', {name:'Publish production site'}) as HTMLButtonElement;
    expect(publish.disabled).toBe(true);
    expect(screen.getByText(/No production data modified/i)).toBeTruthy();
  });

  it('navigates to the project listing without changing the feature branch records', () => {
    render(<BuyerConcept/>);
    fireEvent.click(screen.getByRole('button', {name:'Projects'}));
    fireEvent.hashChange(window);
    expect(screen.getByRole('heading', {level:1}).textContent).toContain('Follow the source');
    expect(screen.getByText('14 records found')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name:'Priority'}));
    expect(screen.getByText('3 records found')).toBeTruthy();
  });
});
