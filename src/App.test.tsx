// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '@/App';
import CompanyPages from '@/components/CompanyPages';
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

describe('Consolidated information architecture', () => {
  it('has six purposeful homepage sections without a duplicate form, map or mission cards', () => {
    window.location.hash = '#/home';
    render(<App />);
    const sections = [...document.querySelectorAll('main section[data-editor-id^="home."]')].map(section => section.getAttribute('data-editor-id'));
    expect(sections).toEqual(['home.hero', 'home.company', 'home.resources', 'home.projects', 'home.gallery', 'home.contact']);
    expect(document.querySelector('#main #contact form')).toBeNull();
    expect(document.querySelector('section[data-editor-id="home.values"]')).toBeNull();
    expect(document.querySelector('section[data-editor-id="home.history"]')).toBeNull();
  });

  it('keeps company, mineral and project details in their own destinations', () => {
    const about = render(<CompanyPages page="about" uploads={[]} />);
    expect(document.querySelector('#vision-mission')).toBeTruthy();
    expect(document.querySelector('#history-details')).toBeTruthy();
    expect(document.querySelector('#industrial-metals')).toBeNull();
    about.unmount();
    const minerals = render(<CompanyPages page="minerals" uploads={[]} />);
    expect(document.querySelector('#industrial-metals')).toBeTruthy();
    expect(document.querySelector('#gemstones')).toBeTruthy();
    expect(document.querySelector('#operations')).toBeNull();
    minerals.unmount();
    const projects = render(<CompanyPages page="projects" uploads={[]} />);
    expect(document.querySelector('#operations')).toBeTruthy();
    expect(document.querySelector('#development-projects')).toBeTruthy();
    expect(document.querySelector('#services')).toBeTruthy();
    projects.unmount();
  });
});
