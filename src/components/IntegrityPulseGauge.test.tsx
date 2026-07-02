import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IntegrityPulseGauge from './IntegrityPulseGauge';

describe('IntegrityPulseGauge', () => {
  it('renders integrity percentage', () => {
    render(<IntegrityPulseGauge analyses={[{ riskScore: 10 }, { riskScore: 20 }]} lang="en" isLightMode={true} />);
    expect(screen.getByText('85%')).toBeTruthy();
  });

  it('shows SECURE status for high integrity', () => {
    render(<IntegrityPulseGauge analyses={[{ riskScore: 5 }]} lang="en" isLightMode={true} />);
    expect(screen.getByText('SECURE')).toBeTruthy();
  });

  it('shows RISK status for low integrity', () => {
    render(<IntegrityPulseGauge analyses={[{ riskScore: 90 }]} lang="en" isLightMode={true} />);
    expect(screen.getByText('RISK')).toBeTruthy();
  });

  it('shows WARNING status for mid integrity', () => {
    render(<IntegrityPulseGauge analyses={[{ riskScore: 30 }]} lang="en" isLightMode={true} />);
    expect(screen.getByText('WARNING')).toBeTruthy();
  });

  it('returns 100% for empty analyses', () => {
    render(<IntegrityPulseGauge analyses={[]} lang="en" isLightMode={true} />);
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('SECURE')).toBeTruthy();
  });
});
