import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads an existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('updates the stored value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    act(() => { result.current[1]('updated'); });
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated');
  });

  it('handles functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    act(() => { result.current[1]((prev) => prev + 1); });
    expect(result.current[0]).toBe(1);
  });

  it('handles JSON.parse errors gracefully', () => {
    localStorage.setItem('bad-json', '{invalid');
    const { result } = renderHook(() => useLocalStorage('bad-json', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('persists across re-renders', () => {
    const { result, rerender } = renderHook(() => useLocalStorage('persist', 0));
    act(() => { result.current[1](42); });
    rerender();
    expect(result.current[0]).toBe(42);
  });
});
