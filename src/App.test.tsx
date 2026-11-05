// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '@/App';
import ContactForm from '@/components/ContactForm';
import Gallery from '@/components/Gallery';

afterEach(cleanup);

describe('App', () => {
  it('renders one h1, a skip link and a closed mobile menu', () => {
    render(<App />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('Skip to content')).toBeTruthy();
    expect(document.querySelector('#main-nav')?.classList.contains('open')).toBe(false);
  });

  it('toggles the mobile menu with correct aria state', () => {
    render(<App />);
    const burger = screen.getByRole('button', { name: 'Open menu' });
    expect(burger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(burger);
    expect(screen.getByRole('button', { name: 'Close menu' }).getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('#main-nav')?.classList.contains('open')).toBe(true);
  });


  it('provides accessible company and portfolio dropdowns with real anchor targets', () => {
    render(<App />);
    const nav = document.querySelector('#main-nav');
    expect(nav?.querySelectorAll('details.nav-dropdown')).toHaveLength(2);
    expect(screen.getByLabelText('Company submenu')).toBeTruthy();
    expect(screen.getByLabelText('Portfolio submenu')).toBeTruthy();
    expect(document.querySelector('#industrial-metals')).toBeTruthy();
    const links = nav?.querySelectorAll<HTMLAnchorElement>('.nav-dropdown-panel a');
    links?.forEach((link) => expect(document.querySelector(link.getAttribute('href')!)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(nav!.querySelector<HTMLAnchorElement>('a[href="#mission"]')!);
    expect(document.querySelector('#main-nav')?.classList.contains('open')).toBe(false);
  });

  it('does not link to a LinkedIn page that is not configured', () => {
    render(<App />);
    expect(screen.queryByText('LinkedIn')).toBeNull();
  });
});

describe('ContactForm', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole('button', { name: /request an introduction/i }));
    expect(await screen.findByText('Please enter your name.')).toBeTruthy();
    expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
    expect(screen.queryByText(/we have received your enquiry/i)).toBeNull();
  });
});

describe('Gallery', () => {
  it('shows a loading status while gallery folders are being fetched', () => {
    render(<Gallery uploads={[]} />);
    expect(screen.getByRole('status').textContent).toContain('Loading folders');
    expect(screen.getByRole('navigation', { name: 'Gallery breadcrumb' })).toBeTruthy();
  });

  it('does not show obsolete built-in media or uploads filters', () => {
    render(<Gallery uploads={[]} />);
    expect(screen.queryByText('13 items')).toBeNull();
    expect(screen.queryByRole('button', { name: 'My uploads' })).toBeNull();
  });
});
