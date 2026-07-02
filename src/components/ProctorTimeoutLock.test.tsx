import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProctorTimeoutLock from './ProctorTimeoutLock';

describe('ProctorTimeoutLock', () => {
  const onUnlock = vi.fn();

  beforeEach(() => {
    onUnlock.mockClear();
  });

  it('renders nothing when not locked', () => {
    const { container } = render(
      <ProctorTimeoutLock lang="en" isLightMode={false} isLocked={false} onUnlock={onUnlock} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the overlay when locked', () => {
    render(
      <ProctorTimeoutLock lang="en" isLightMode={false} isLocked={true} onUnlock={onUnlock} />
    );
    expect(screen.getByText('Proctor Session Suspended')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••')).toBeInTheDocument();
    expect(screen.getByText('De-authorize & Unlock')).toBeInTheDocument();
  });

  it('shows Arabic text when lang is ar', () => {
    render(
      <ProctorTimeoutLock lang="ar" isLightMode={false} isLocked={true} onUnlock={onUnlock} />
    );
    expect(screen.getByText('جلسة المراقب معلقة')).toBeInTheDocument();
    expect(screen.getByText('إلغاء تعليق الجلسة')).toBeInTheDocument();
  });

  it('calls onUnlock when correct passcode is submitted', async () => {
    const user = userEvent.setup();
    render(
      <ProctorTimeoutLock lang="en" isLightMode={false} isLocked={true} onUnlock={onUnlock} />
    );
    const input = screen.getByPlaceholderText('••••');
    await user.type(input, 'admin');
    await user.click(screen.getByText('De-authorize & Unlock'));
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('shows alert when incorrect passcode is submitted', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    render(
      <ProctorTimeoutLock lang="en" isLightMode={false} isLocked={true} onUnlock={onUnlock} />
    );
    const input = screen.getByPlaceholderText('••••');
    await user.type(input, 'wrong');
    await user.click(screen.getByText('De-authorize & Unlock'));
    expect(alertMock).toHaveBeenCalledWith('Passcode incorrect! Hint: use "admin"');
    expect(onUnlock).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it('submits the form on Enter key', async () => {
    const user = userEvent.setup();
    render(
      <ProctorTimeoutLock lang="en" isLightMode={false} isLocked={true} onUnlock={onUnlock} />
    );
    const input = screen.getByPlaceholderText('••••');
    await user.type(input, 'admin{Enter}');
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });
});
