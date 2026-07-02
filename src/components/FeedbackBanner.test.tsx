import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FeedbackBanner from './FeedbackBanner';

describe('FeedbackBanner', () => {
  it('renders nothing when feedback is null', () => {
    const { container } = render(<FeedbackBanner feedback={null} lang="en" isLightMode={true} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders success banner with check icon and title', () => {
    render(<FeedbackBanner feedback={{ success: true, message: 'Done!' }} lang="en" isLightMode={true} />);
    expect(screen.getByText('Done!')).toBeTruthy();
    expect(screen.getByText('Telemetry Ingestion Approved')).toBeTruthy();
    expect(document.querySelector('.lucide-shield-check')).toBeTruthy();
  });

  it('renders error banner with alert icon and title', () => {
    render(<FeedbackBanner feedback={{ success: false, message: 'Failed!' }} lang="en" isLightMode={true} />);
    expect(screen.getByText('Failed!')).toBeTruthy();
    expect(screen.getByText('Security Diagnostic Refused')).toBeTruthy();
    expect(document.querySelector('.lucide-shield-alert')).toBeTruthy();
  });

  it('renders Arabic error title when lang is ar', () => {
    render(<FeedbackBanner feedback={{ success: false, message: 'فشل' }} lang="ar" isLightMode={true} />);
    expect(screen.getByText('فشل الرصد الفني')).toBeTruthy();
  });
});
