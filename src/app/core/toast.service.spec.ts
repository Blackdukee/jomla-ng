import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds toasts via convenience methods and auto-dismisses after duration', () => {
    service.success('Saved', 'Your changes were stored.');
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0]).toMatchObject({
      title: 'Saved',
      description: 'Your changes were stored.',
      type: 'success'
    });

    vi.advanceTimersByTime(4000);
    expect(service.toasts()).toHaveLength(0);
  });

  it('clears the auto-dismiss timer when remove() is called early', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    service.show('First', 'Will be dismissed early');
    service.show('Second', 'Longer toast', 'warning', 10000);

    const firstId = service.toasts()[0].id;
    service.remove(firstId);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].title).toBe('Second');

    vi.advanceTimersByTime(4000);
    expect(service.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(6000);
    expect(service.toasts()).toHaveLength(0);
  });

  it('sanitizes internal error stack traces and sensitive infrastructure messages on danger toasts', () => {
    const internalErrors = [
      'System.NullReferenceException: Object reference not set to an instance of an object.',
      'at Jomla.Application.Features.Batches.JoinBatchHandler.Handle()',
      'Violation of UNIQUE KEY constraint UQ_Offers_Title',
      'Http failure response for https://api.example.com/offers: 500 OK',
      'Connection refused at http://localhost:5174/api/batches',
      'Stripe payment hold failed: card declined internally',
      'Missing payment_intent configuration'
    ];

    for (const msg of internalErrors) {
      service.error('Error', msg);
    }

    for (const toast of service.toasts()) {
      expect(toast.description).toBe('An unexpected system error occurred. Please try again later.');
    }
  });

  it('preserves safe user-facing error messages on danger toasts', () => {
    service.error('Cannot Join', 'Only 3 units remaining in this batch.');
    expect(service.toasts()[0].description).toBe('Only 3 units remaining in this batch.');
  });

  describe('errorApi', () => {
    it('shows offline connectivity message when status is 0', () => {
      service.errorApi('Network Error', { status: 0, message: 'Unknown Error' });
      expect(service.toasts()[0].description).toBe(
        'Unable to reach the server. Please check your connection and try again.'
      );
    });

    it('extracts and deduplicates up to 3 ValidationProblemDetails error messages', () => {
      service.errorApi('Validation Failed', {
        status: 400,
        error: {
          title: 'One or more validation errors occurred.',
          errors: {
            Email: ['Email is required.', 'Email is required.'],
            Password: ['Password must be at least 8 characters.'],
            FirstName: ['First name is required.'],
            LastName: ['Last name should not appear beyond limit of 3.']
          }
        }
      });

      expect(service.toasts()[0].description).toBe(
        'Email is required. Password must be at least 8 characters. First name is required.'
      );
    });

    it('falls back cleanly through detail -> error -> message -> string -> title -> top message -> default', () => {
      service.errorApi('E1', { error: { detail: 'Detail message', error: 'Inner', title: 'Title' } });
      service.errorApi('E2', { error: { error: 'Error field', message: 'Msg field' } });
      service.errorApi('E3', { error: { message: 'Body message', title: 'Title' } });
      service.errorApi('E4', { error: '  Raw string error  ' });
      service.errorApi('E5', { error: { title: 'Problem title' }, message: 'Top msg' });
      service.errorApi('E6', { message: 'Top-level fallback' });
      service.errorApi('E7', null);

      const descriptions = service.toasts().map(t => t.description);
      expect(descriptions).toEqual([
        'Detail message',
        'Error field',
        'Body message',
        'Raw string error',
        'Problem title',
        'Top-level fallback',
        'An unexpected error occurred.'
      ]);
    });
  });
});
