import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test crash');
};

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary lang="en">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
    expect(screen.getByText('Test crash')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it('shows Arabic error text when lang is ar', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary lang="ar">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('حدث خطأ غير متوقع')).toBeInTheDocument();
    expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it('resets on "Try Again" click', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    const BuggyComponent = () => {
      if (shouldThrow) throw new Error('Oops');
      return <div>Recovered</div>;
    };

    const { rerender } = render(
      <ErrorBoundary lang="en">
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Unexpected Error')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));

    rerender(
      <ErrorBoundary lang="en">
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
