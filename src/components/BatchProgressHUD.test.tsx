import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BatchProgressHUD from './BatchProgressHUD';

describe('BatchProgressHUD', () => {
  it('renders nothing when batchProgress is null', () => {
    const { container } = render(<BatchProgressHUD batchProgress={null} batchOpName="" lang="en" isLightMode={true} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders progress percentage and operation name', () => {
    render(<BatchProgressHUD batchProgress={42} batchOpName="Processing..." lang="en" isLightMode={true} />);
    expect(screen.getByText('Processing...')).toBeTruthy();
    expect(screen.getByText('42%')).toBeTruthy();
  });

  it('renders Arabic title when lang is ar', () => {
    render(<BatchProgressHUD batchProgress={50} batchOpName="test" lang="ar" isLightMode={true} />);
    expect(screen.getByText('معالجة جماعية ذكية')).toBeTruthy();
  });
});
