import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickActionsMenu from './QuickActionsMenu';

describe('QuickActionsMenu', () => {
  const contextMenu = { x: 100, y: 200, studentId: 'STD-001' };

  it('renders nothing when contextMenu is null', () => {
    const { container } = render(
      <QuickActionsMenu contextMenu={null} lang="en" isLightMode={true} showToast={vi.fn()} onSelectStudent={vi.fn()} onFlagForReview={vi.fn()} onClearCache={vi.fn()} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the student ID in the header', () => {
    render(
      <QuickActionsMenu contextMenu={contextMenu} lang="en" isLightMode={true} showToast={vi.fn()} onSelectStudent={vi.fn()} onFlagForReview={vi.fn()} onClearCache={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText('STD-001')).toBeTruthy();
  });

  it('renders all 4 action buttons', () => {
    render(
      <QuickActionsMenu contextMenu={contextMenu} lang="en" isLightMode={true} showToast={vi.fn()} onSelectStudent={vi.fn()} onFlagForReview={vi.fn()} onClearCache={vi.fn()} onClose={vi.fn()} />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('calls onClose and onSelectStudent when first button clicked', () => {
    const onClose = vi.fn();
    const onSelectStudent = vi.fn();
    render(
      <QuickActionsMenu contextMenu={contextMenu} lang="en" isLightMode={true} showToast={vi.fn()} onSelectStudent={onSelectStudent} onFlagForReview={vi.fn()} onClearCache={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onSelectStudent).toHaveBeenCalledWith('STD-001');
    expect(onClose).toHaveBeenCalled();
  });
});
