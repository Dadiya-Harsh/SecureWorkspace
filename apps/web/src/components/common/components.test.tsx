// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FileCard, SAMPLE_FILES } from './FileCard';
import { KeyLens } from './KeyLens';
import { TextDecode } from './TextDecode';
import { MarchingDash } from './MarchingDash';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

beforeAll(() => {
  // Mock IntersectionObserver for JSDOM
  class MockIntersectionObserver {
    observe = () => {};
    unobserve = () => {};
    disconnect = () => {};
  }
  globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  cleanup();
});

describe('FileCard component', () => {
  it('renders front and back faces with correct content', () => {
    const file = SAMPLE_FILES[0];
    const { container } = render(<FileCard file={file} />);

    expect(screen.getByText(file.name)).toBeDefined();
    expect(screen.getByText(file.tag)).toBeDefined();
    expect(screen.getByText(file.hash)).toBeDefined();
    expect(screen.getByText(`sealed · ${file.size}`)).toBeDefined();

    const root = container.querySelector('.file-card-root') as HTMLElement;
    expect(root).toBeDefined();
    expect(root.style.transform).toContain('rotateY(0deg)');
  });

  it('renders flipped state when flipped prop is true', () => {
    const file = SAMPLE_FILES[1];
    const { container } = render(<FileCard file={file} flipped={true} />);

    const root = container.querySelector('.file-card-root') as HTMLElement;
    expect(root.style.transform).toContain('rotateY(180deg)');
  });

  it('renders all variants (doc, pass, photo, note)', () => {
    SAMPLE_FILES.forEach((file) => {
      const { unmount } = render(<FileCard file={file} />);
      expect(screen.getByText(file.name)).toBeDefined();
      unmount();
    });
  });

  it('handles click callback', () => {
    let clicked = false;
    render(<FileCard file={SAMPLE_FILES[0]} onClick={() => { clicked = true; }} />);
    const card = screen.getByRole('button');
    fireEvent.click(card);
    expect(clicked).toBe(true);
  });
});

describe('KeyLens component', () => {
  it('renders the drive bar and both sealed and plain tile layers', () => {
    render(<KeyLens />);
    expect(screen.getByText('My Drive')).toBeDefined();
    expect(screen.getByText('your key')).toBeDefined();

    // Check accessible screen reader static twin
    expect(screen.getByText('Encrypted Files vs Decrypted View')).toBeDefined();
    expect(screen.getAllByText(/Q3_tax_return\.xlsx/).length).toBeGreaterThan(0);
  });
});

describe('TextDecode component', () => {
  it('renders real text in accessible label and screen-reader element', () => {
    render(<TextDecode text="Tax_Return_2026.xlsx" decoded={true} />);
    const srElements = screen.getAllByText('Tax_Return_2026.xlsx');
    expect(srElements.length).toBeGreaterThan(0);
  });
});

describe('MarchingDash component', () => {
  it('renders horizontal and vertical lines with label', () => {
    const { container: hCont } = render(
      <MarchingDash active={true} orientation="horizontal" hasDot={true} label="Argon2id" />
    );
    expect(screen.getByText('Argon2id')).toBeDefined();
    expect(hCont.querySelector('i')).toBeDefined();

    const { container: vCont } = render(
      <MarchingDash active={false} orientation="vertical" hasDot={false} />
    );
    const dash = vCont.querySelector('.marching-dash-root') as HTMLElement;
    expect(dash.style.width).toBe('2px');
    expect(dash.style.opacity).toBe('0.45');
  });
});

describe('Footer component', () => {
  it('renders full footer with wordmark and seal', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByText('Free · Open source · Apache 2.0 · Windows beta')).toBeDefined();
    expect(screen.getByText('Docs')).toBeDefined();
    expect(screen.getByText('Privacy policy')).toBeDefined();
    expect(screen.getByText('Terms')).toBeDefined();
    expect(screen.getByText('Source on GitHub')).toBeDefined();
    expect(screen.getByText('Security model')).toBeDefined();
    expect(screen.getByText('Contact')).toBeDefined();
    expect(screen.getByText('SecureWorkspace')).toBeDefined();
  });

  it('renders compact footer without wordmark on compact mode', () => {
    render(
      <BrowserRouter>
        <Footer compact={true} />
      </BrowserRouter>
    );
    expect(screen.getByText('Docs')).toBeDefined();
    expect(screen.queryByText('Free · Open source · Apache 2.0 · Windows beta')).toBeNull();
  });
});

describe('Navbar component', () => {
  it('renders brand logo and nav links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    expect(screen.getByText('SecureWorkspace')).toBeDefined();
    expect(screen.getByText('How it works')).toBeDefined();
    expect(screen.getByText('Security')).toBeDefined();
    expect(screen.getByText('Docs')).toBeDefined();
    expect(screen.getByText('GitHub')).toBeDefined();
    expect(screen.getByText('Web viewer')).toBeDefined();
    expect(screen.getByText('Download beta')).toBeDefined();
  });
});
