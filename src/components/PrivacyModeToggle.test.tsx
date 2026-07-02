import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PrivacyModeToggle from './PrivacyModeToggle';

describe('PrivacyModeToggle', () => {
  it('shows Privacy when enabled', () => {
    render(<PrivacyModeToggle privacyMode={true} lang="en" isLightMode={true} showToast={vi.fn()} onToggle={vi.fn()} />);
    expect(screen.getByText('Privacy')).toBeTruthy();
  });

  it('shows Show when disabled', () => {
    render(<PrivacyModeToggle privacyMode={false} lang="en" isLightMode={true} showToast={vi.fn()} onToggle={vi.fn()} />);
    expect(screen.getByText('Show')).toBeTruthy();
  });

  it('calls onToggle with the new value on click', () => {
    const onToggle = vi.fn();
    render(<PrivacyModeToggle privacyMode={false} lang="en" isLightMode={true} showToast={vi.fn()} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});
