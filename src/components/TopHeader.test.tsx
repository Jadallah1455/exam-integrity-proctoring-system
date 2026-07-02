import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TopHeader from './TopHeader';

const baseProps = {
  currentT: { projectTag: 'PROCTOR', rtlCompliant: 'RTL', appName: 'Test App' },
  lang: 'en',
  isLightMode: true,
  userRole: 'proctor' as const,
  loading: false,
  liveFeedActive: false,
  analyses: [],
  lastRefreshTime: null,
  showNotifMenu: false,
  riskThreshold: 70,
  desktopNotificationsEnabled: false,
  onOpenMobileMenu: vi.fn(),
  onRoleChange: vi.fn(),
  onLangChange: vi.fn(),
  onThemeChange: vi.fn(),
  onLiveFeedToggle: vi.fn(),
  onOpenKeyboardHelp: vi.fn(),
  onToggleNotifMenu: vi.fn(),
  onRiskChange: vi.fn(),
  onSelectStudent: vi.fn(),
  onToggleDesktopNotifs: vi.fn(),
  onCloseNotifMenu: vi.fn(),
};

describe('TopHeader', () => {
  it('renders the app name', () => {
    render(<TopHeader {...baseProps} />);
    expect(screen.getByText('Test App')).toBeTruthy();
  });

  it('renders project tag', () => {
    render(<TopHeader {...baseProps} />);
    expect(screen.getByText('PROCTOR')).toBeTruthy();
  });

  it('shows Proctor role as active', () => {
    render(<TopHeader {...baseProps} />);
    expect(screen.getByText('👁️ Proctor')).toBeTruthy();
  });

  it('calls onLangChange when language button clicked', () => {
    const onLangChange = vi.fn();
    render(<TopHeader {...baseProps} onLangChange={onLangChange} />);
    const langBtn = screen.getByText(/English|العربية/);
    fireEvent.click(langBtn);
    expect(onLangChange).toHaveBeenCalledOnce();
  });

  it('calls onThemeChange when theme button clicked', () => {
    const onThemeChange = vi.fn();
    render(<TopHeader {...baseProps} onThemeChange={onThemeChange} />);
    const themeBtn = screen.getByText(/Dark|Light/);
    fireEvent.click(themeBtn);
    expect(onThemeChange).toHaveBeenCalledOnce();
  });

  it('shows loading indicator when loading is true', () => {
    render(<TopHeader {...baseProps} loading={true} />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });
});
