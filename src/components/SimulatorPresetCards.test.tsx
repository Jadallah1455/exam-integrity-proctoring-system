import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SimulatorPresetCards from './SimulatorPresetCards';

describe('SimulatorPresetCards', () => {
  it('renders all 4 preset cards', () => {
    render(<SimulatorPresetCards lang="en" isLightMode={true} loading={false} onInject={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('calls onInject with the correct preset type when clicked', () => {
    const onInject = vi.fn();
    render(<SimulatorPresetCards lang="en" isLightMode={true} loading={false} onInject={onInject} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onInject).toHaveBeenCalledWith('collusion_1');
    fireEvent.click(buttons[1]);
    expect(onInject).toHaveBeenCalledWith('leak');
    fireEvent.click(buttons[2]);
    expect(onInject).toHaveBeenCalledWith('tampered_signature');
    fireEvent.click(buttons[3]);
    expect(onInject).toHaveBeenCalledWith('normal');
  });

  it('disables buttons when loading is true', () => {
    render(<SimulatorPresetCards lang="en" isLightMode={true} loading={true} onInject={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(b => expect(b).toBeDisabled());
  });

  it('renders the Inject & Run button text on each card', () => {
    render(<SimulatorPresetCards lang="en" isLightMode={true} loading={false} onInject={vi.fn()} />);
    expect(screen.getAllByText('Inject & Run').length).toBe(4);
  });
});
