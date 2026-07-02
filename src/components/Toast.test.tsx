import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Toast from './Toast';

describe('Toast', () => {
  it('renders nothing when toast is null', () => {
    const { container } = render(<Toast toast={null} lang="en" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders English message when lang is en', () => {
    render(<Toast toast={{ messageAr: 'مرحبا', messageEn: 'Hello' }} lang="en" />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders Arabic message when lang is ar', () => {
    render(<Toast toast={{ messageAr: 'مرحبا', messageEn: 'Hello' }} lang="ar" />);
    expect(screen.getByText('مرحبا')).toBeTruthy();
  });

  it('renders the Bell icon', () => {
    const { container } = render(<Toast toast={{ messageAr: 'x', messageEn: 'y' }} lang="en" />);
    const bellIcon = container.querySelector('.lucide-bell');
    expect(bellIcon).toBeTruthy();
  });

  it('has the correct id attribute', () => {
    const { container } = render(<Toast toast={{ messageAr: 'x', messageEn: 'y' }} lang="en" />);
    expect(container.querySelector('#interactive-proctor-toast')).toBeTruthy();
  });
});
