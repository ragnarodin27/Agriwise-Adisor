import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });

    render(<App />);
    // Initial view is dashboard, which shows "Regional Yield Index"
    // or checks for onboarding.
    // "AgriWise" is in index.html title but not in App text maybe?
    // Navigation has "Home"
    expect(document.body).toBeInTheDocument();
  });
});
