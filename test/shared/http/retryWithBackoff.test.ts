import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryWithBackoff } from '../../../src/shared/http/retryWithBackoff';

const createRateLimitError = (retryAfterSeconds: string, additionalHeaders?: Record<string, string>) => ({
  status: 429,
  headers: { 'retry-after': retryAfterSeconds, ...additionalHeaders },
});

const createRateLimitMock = (resetDelay: string, additionalHeaders?: Record<string, string>) =>
  vi.fn().mockRejectedValueOnce(createRateLimitError(resetDelay, additionalHeaders)).mockResolvedValueOnce('success');

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('when function succeeds immediately then returns result without retry', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const mockFn = vi.fn().mockResolvedValue('success');

    const result = await retryWithBackoff(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('when rate limited then retries with delay from headers', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const mockFn = createRateLimitMock('5');

    const promise = retryWithBackoff(mockFn);
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
  });

  it('when error is not rate limit then throws immediately without retry', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const mockFn = vi.fn().mockRejectedValue({ status: 500, message: 'Internal Server Error' });

    await expect(retryWithBackoff(mockFn)).rejects.toEqual({ status: 500, message: 'Internal Server Error' });

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('when rate limited multiple times then calls onRetry for each retry', async () => {
    const error = createRateLimitError('1');
    const mockFn = vi.fn().mockRejectedValueOnce(error).mockRejectedValueOnce(error).mockResolvedValueOnce('success');

    const onRetry = vi.fn();

    const promise = retryWithBackoff(mockFn, { onRetry });
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, 1000);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, 1000);
  });

  it('when headers missing or invalid then throws error', async () => {
    const testCases = [
      { status: 429 },
      { status: 429, headers: {} },
      { status: 429, headers: { 'retry-after': 'invalid' } },
    ];

    for (const error of testCases) {
      const mockFn = vi.fn().mockRejectedValue(error);
      await expect(retryWithBackoff(mockFn)).rejects.toEqual(error);
      expect(mockFn).toHaveBeenCalledTimes(1);
      vi.clearAllMocks();
    }
  });

  it('when max retries exceeded then throws original error', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const error = new Error('Rate limit exceeded');
    Object.assign(error, { status: 429, headers: { 'retry-after': '1' } });
    const mockFn = vi.fn().mockRejectedValue(error);

    const promise = retryWithBackoff(mockFn, { maxRetries: 2 });
    const expectation = expect(promise).rejects.toThrow('Rate limit exceeded');
    await vi.advanceTimersByTimeAsync(3000);
    await expectation;

    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
  });

  it('when error is not an object then throws immediately without retry', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const testCases = ['string error', null];

    for (const error of testCases) {
      const mockFn = vi.fn().mockRejectedValue(error);
      await expect(retryWithBackoff(mockFn)).rejects.toBe(error);
      expect(mockFn).toHaveBeenCalledTimes(1);
      vi.clearAllMocks();
    }

    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });
});
