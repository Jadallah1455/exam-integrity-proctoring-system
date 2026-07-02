import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MobileDrawerMenu from './MobileDrawerMenu';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const teachers = [
  { id: 't1', nameAr: 'أحمد', nameEn: 'Ahmed' },
];

const baseProps = {
  mobileMenuOpen: true,
  lang: 'en' as const,
  isLightMode: true,
  activeTab: 'dashboard',
  userRole: 'proctor',
  teachers,
  selectedTeacherId: 't1',
  currentT: {
    appName: 'Test App',
    sidebarSubtitle: 'Menu',
    projectInfoTitle: 'Info',
    projectInfoDesc: 'Description',
    sidebarTab1: 'Control Room',
    sidebarTab2: 'API & Docs',
  },
  onClose: vi.fn(),
  onTabChange: vi.fn(),
  onTeacherChange: vi.fn(),
  onLangChange: vi.fn(),
  onThemeChange: vi.fn(),
  onRoleChange: vi.fn(),
  onOpenKeyboardHelp: vi.fn(),
  showToast: vi.fn(),
};

describe('MobileDrawerMenu', () => {
  it('renders nothing when menu is closed', () => {
    const { container } = render(<MobileDrawerMenu {...baseProps} mobileMenuOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the drawer when open', () => {
    render(<MobileDrawerMenu {...baseProps} />);
    expect(screen.getByText('Test App')).toBeTruthy();
  });

  it('renders the teacher name in the credentials card', () => {
    render(<MobileDrawerMenu {...baseProps} />);
    const ahmedElements = screen.getAllByText('Ahmed');
    expect(ahmedElements.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<MobileDrawerMenu {...baseProps} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders navigation tabs', () => {
    render(<MobileDrawerMenu {...baseProps} />);
    expect(screen.getByText('Control Room')).toBeTruthy();
    expect(screen.getByText('API & Docs')).toBeTruthy();
  });

  it('renders preferences section with language and theme buttons', () => {
    render(<MobileDrawerMenu {...baseProps} />);
    expect(screen.getByText('Account Role')).toBeTruthy();
    expect(screen.getByText('Interface Language')).toBeTruthy();
    expect(screen.getByText('Global Theme')).toBeTruthy();
  });
});
