import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HealthIndicators from './HealthIndicators';

const baseProps = {
  currentT: { keyboardShortcutTitle: 'Keys' },
  lang: 'en',
  isLightMode: true,
  analyses: [],
  user: { nameAr: 'أحمد', nameEn: 'Ahmed', role: 'proctor' },
  sessionTimeLeft: 3600,
  privacyMode: false,
  formatSessionTime: (s: number) => `${Math.floor(s / 60)}m`,
  onLogout: vi.fn(),
  onPrivacyToggle: vi.fn(),
  showToast: vi.fn(),
};

describe('HealthIndicators', () => {
  it('renders user name in English', () => {
    render(<HealthIndicators {...baseProps} />);
    expect(screen.getByText('Ahmed')).toBeTruthy();
  });

  it('renders session time', () => {
    render(<HealthIndicators {...baseProps} />);
    expect(screen.getByText('60m')).toBeTruthy();
  });

  it('renders keyboard shortcut title', () => {
    render(<HealthIndicators {...baseProps} />);
    expect(screen.getByText('Keys:')).toBeTruthy();
  });

  it('renders logout button', () => {
    render(<HealthIndicators {...baseProps} />);
    expect(screen.getByTitle('Logout')).toBeTruthy();
  });
});
