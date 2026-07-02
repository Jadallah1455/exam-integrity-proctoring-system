import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    mockOnLogin.mockClear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders the login form with username and password fields', () => {
    render(<LoginPage onLogin={mockOnLogin} />);
    expect(screen.getByText('اسم المستخدم')).toBeInTheDocument();
    expect(screen.getByText('كلمة المرور')).toBeInTheDocument();
  });

  it('shows English text when language is toggled', async () => {
    const user = userEvent.setup();
    render(<LoginPage onLogin={mockOnLogin} />);
    await user.click(screen.getByRole('button', { name: /en/i }));
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('shows an error on failed login', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Invalid credentials' }),
    } as Response);

    render(<LoginPage onLogin={mockOnLogin} />);
    await user.type(screen.getByPlaceholderText('أدخل اسم المستخدم'), 'wrong');
    await user.type(screen.getByPlaceholderText('أدخل كلمة المرور'), 'wrong');
    await user.click(screen.getByRole('button', { name: /دخول/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('calls onLogin on successful login', async () => {
    const user = userEvent.setup();
    const userData = { id: '1', username: 'proctor', role: 'proctor', nameAr: 'مراقب', nameEn: 'Proctor' };
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ success: true, user: userData }),
    } as Response);

    render(<LoginPage onLogin={mockOnLogin} />);
    await user.type(screen.getByPlaceholderText('أدخل اسم المستخدم'), 'proctor');
    await user.type(screen.getByPlaceholderText('أدخل كلمة المرور'), 'pass123');
    await user.click(screen.getByRole('button', { name: /دخول/i }));

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith(userData);
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginPage onLogin={mockOnLogin} />);
    const passwordInput = screen.getByPlaceholderText('أدخل كلمة المرور');
    expect(passwordInput).toHaveAttribute('type', 'password');
    const passwordContainer = passwordInput.closest('.relative')!;
    const eyeToggle = passwordContainer.querySelector('button');
    expect(eyeToggle).toBeDefined();
    await user.click(eyeToggle!);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
