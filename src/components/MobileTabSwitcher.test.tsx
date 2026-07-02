import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MobileTabSwitcher from './MobileTabSwitcher';

describe('MobileTabSwitcher', () => {
  it('renders all 6 tab buttons', () => {
    render(<MobileTabSwitcher activeTab="dashboard" lang="en" isLightMode={true} onTabChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
  });

  it('highlights the active tab', () => {
    render(<MobileTabSwitcher activeTab="simulator" lang="en" isLightMode={true} onTabChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const simulatorBtn = buttons.find(b => b.textContent === 'Simulator');
    expect(simulatorBtn?.className).toContain('bg-blue-600');
  });

  it('calls onTabChange with the correct tab id', () => {
    const onTabChange = vi.fn();
    render(<MobileTabSwitcher activeTab="dashboard" lang="en" isLightMode={true} onTabChange={onTabChange} />);
    const buttons = screen.getAllByRole('button');
    const analyticsBtn = buttons.find(b => b.textContent === 'Analytics');
    fireEvent.click(analyticsBtn!);
    expect(onTabChange).toHaveBeenCalledWith('analytics');
  });
});
