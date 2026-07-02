import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThresholdNotifier from './ThresholdNotifier';

const baseProps = {
  showNotifMenu: false,
  riskThreshold: 70,
  desktopNotificationsEnabled: false,
  analyses: [
    { riskScore: 85, studentId: 'S1', studentName: 'Alice' },
    { riskScore: 45, studentId: 'S2', studentName: 'Bob' },
  ],
  lang: 'en',
  onToggle: vi.fn(),
  onRiskChange: vi.fn(),
  onSelectStudent: vi.fn(),
  onToggleNotifications: vi.fn(),
  onClose: vi.fn(),
};

describe('ThresholdNotifier', () => {
  it('renders the bell button', () => {
    render(<ThresholdNotifier {...baseProps} />);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('shows breach count badge when analyses exceed threshold', () => {
    render(<ThresholdNotifier {...baseProps} />);
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('hides the dropdown when showNotifMenu is false', () => {
    render(<ThresholdNotifier {...baseProps} />);
    expect(screen.queryByText('Alert Notify Boundary:')).toBeNull();
  });

  it('shows the dropdown when showNotifMenu is true', () => {
    render(<ThresholdNotifier {...baseProps} showNotifMenu={true} />);
    expect(screen.getByText('Alert Notify Boundary:')).toBeTruthy();
  });

  it('calls onToggle when bell is clicked', () => {
    const onToggle = vi.fn();
    render(<ThresholdNotifier {...baseProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('calls onRiskChange when slider moves', () => {
    const onRiskChange = vi.fn();
    render(<ThresholdNotifier {...baseProps} showNotifMenu={true} onRiskChange={onRiskChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '80' } });
    expect(onRiskChange).toHaveBeenCalledWith(80);
  });
});
