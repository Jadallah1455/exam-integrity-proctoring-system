import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
  it('renders English footer text', () => {
    render(<Footer currentT={{ footerTitle: 'My Title', footerCopyright: '© 2026' }} isLightMode={true} />);
    expect(screen.getByText('My Title')).toBeTruthy();
    expect(screen.getByText('© 2026')).toBeTruthy();
  });

  it('renders Arabic footer text', () => {
    render(<Footer currentT={{ footerTitle: 'العنوان', footerCopyright: 'جميع الحقوق محفوظة' }} isLightMode={false} />);
    expect(screen.getByText('العنوان')).toBeTruthy();
    expect(screen.getByText('جميع الحقوق محفوظة')).toBeTruthy();
  });
});
