import { renderHook, act } from '@testing-library/react';

import { API_ENDPOINTS } from '../constants';
import useEmailSend from '../hooks/useEmailSend';

import { getRecordRef } from '@/helpers/urls';
import { NotificationManager } from '@/services/notifications';

jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('@/helpers/urls', () => ({
  ...jest.requireActual('@/helpers/urls'),
  getRecordRef: jest.fn(() => '')
}));

const okResponse = (body = { success: true }) => ({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue(body)
});

const failedResponse = (status = 500, body = {}) => ({
  ok: false,
  status,
  json: jest.fn().mockResolvedValue(body)
});

const EMAIL_DATA = {
  to: 'client@example.com',
  subject: 'Договор',
  body: 'Добрый день!'
};

/** Opens the modal through the public API so the form values come from the hook itself. */
const openFilledForm = result => {
  act(() => {
    result.current.handleSendEmail(EMAIL_DATA);
  });
};

describe('useEmailSend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRecordRef.mockReturnValue('');
    global.fetch = jest.fn().mockResolvedValue(okResponse());
  });

  describe('form state', () => {
    it('starts with an empty form and a hidden modal', () => {
      const { result } = renderHook(() => useEmailSend());

      expect(result.current.showEmailModal).toBe(false);
      expect(result.current.isEmailSending).toBe(false);
      expect(result.current.emailFormData).toEqual({ to: '', subject: '', body: '', addToActivities: true });
    });

    it('handleSendEmail fills the form from the message and opens the modal', () => {
      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);

      expect(result.current.showEmailModal).toBe(true);
      expect(result.current.emailFormData).toEqual({ ...EMAIL_DATA, addToActivities: true });
    });

    it('handleSendEmail ignores an empty payload', () => {
      const { result } = renderHook(() => useEmailSend());

      act(() => {
        result.current.handleSendEmail(null);
      });

      expect(result.current.showEmailModal).toBe(false);
    });

    it('handleEmailFieldChange updates a single field and keeps the rest', () => {
      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      act(() => {
        result.current.handleEmailFieldChange('addToActivities', false);
      });

      expect(result.current.emailFormData).toEqual({ ...EMAIL_DATA, addToActivities: false });
    });

    it('handleEmailModalClose hides the modal and resets the form', () => {
      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      act(() => {
        result.current.handleEmailModalClose();
      });

      expect(result.current.showEmailModal).toBe(false);
      expect(result.current.emailFormData).toEqual({ to: '', subject: '', body: '', addToActivities: true });
    });
  });

  describe('sending', () => {
    // Test 23
    it('sends exactly one POST and reports success', async () => {
      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      await act(async () => {
        await result.current.handleEmailSend();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(API_ENDPOINTS.SEND_MAIL);
      expect(options.method).toBe('POST');
      // `getRecordRef` returns an empty string under IS_TEST_ENV, hence `null` in the payload.
      expect(JSON.parse(options.body)).toEqual({ ...EMAIL_DATA, addToActivities: true, recordRef: null });

      expect(NotificationManager.success).toHaveBeenCalledTimes(1);
      expect(NotificationManager.error).not.toHaveBeenCalled();
      // A successful send closes the form.
      expect(result.current.showEmailModal).toBe(false);
    });

    // The address of a record created in the browser carries an `-alias-<n>` suffix minted by
    // `Records`; it addresses the page, not the record, and the backend resolves nothing with it —
    // the letter goes out but is attached to no card.
    it('sends the record reference of the page without its -alias- suffix', async () => {
      getRecordRef.mockReturnValue('emodel/case@1-alias-3');
      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      await act(async () => {
        await result.current.handleEmailSend();
      });

      const [, options] = global.fetch.mock.calls[0];
      expect(JSON.parse(options.body).recordRef).toBe('emodel/case@1');
    });

    it('sends null when the page carries no record reference', async () => {
      getRecordRef.mockReturnValue('');
      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      await act(async () => {
        await result.current.handleEmailSend();
      });

      const [, options] = global.fetch.mock.calls[0];
      expect(JSON.parse(options.body).recordRef).toBeNull();
    });

    // Test 24 — the defect itself: a double click within one render cycle.
    it('makes exactly one POST when called twice within a single render cycle', async () => {
      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      await act(async () => {
        const first = result.current.handleEmailSend();
        const second = result.current.handleEmailSend();
        await Promise.all([first, second]);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(NotificationManager.success).toHaveBeenCalledTimes(1);
    });

    // Test 25
    it('releases the latch after a completed send', async () => {
      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      await act(async () => {
        await result.current.handleEmailSend();
      });

      openFilledForm(result);
      await act(async () => {
        await result.current.handleEmailSend();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // The modal's Cancel/× stay live while a send is in flight, so the latch and the state can drift
    // apart: the button says idle, the ref still says busy, and the next send vanishes without a
    // trace. Both cases below cover that window.
    describe('modal closed while a send is in flight', () => {
      /** Resolves the first POST only when told to, so a second draft can be started meanwhile. */
      const deferredFetch = () => {
        let release;
        const pending = new Promise(resolve => {
          release = resolve;
        });
        global.fetch = jest.fn().mockReturnValueOnce(pending).mockResolvedValue(okResponse());
        return () => release(okResponse());
      };

      it('still sends the next draft after the previous one was abandoned', async () => {
        const release = deferredFetch();
        const { result } = renderHook(() => useEmailSend());

        openFilledForm(result);
        let inFlight;
        act(() => {
          inFlight = result.current.handleEmailSend();
        });

        act(() => {
          result.current.handleEmailModalClose();
        });

        openFilledForm(result);
        await act(async () => {
          await result.current.handleEmailSend();
        });

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(NotificationManager.success).toHaveBeenCalledTimes(1);

        await act(async () => {
          release();
          await inFlight;
        });
      });

      it('does not wipe the new draft when the abandoned send completes', async () => {
        const release = deferredFetch();
        const { result } = renderHook(() => useEmailSend());

        openFilledForm(result);
        let inFlight;
        act(() => {
          inFlight = result.current.handleEmailSend();
        });

        act(() => {
          result.current.handleEmailModalClose();
        });
        openFilledForm(result);
        act(() => {
          result.current.handleEmailFieldChange('body', 'Второе письмо');
        });

        await act(async () => {
          release();
          await inFlight;
        });

        // The first email really was sent, so it is confirmed — but the form on screen is the second
        // draft and must survive untouched.
        expect(NotificationManager.success).toHaveBeenCalledTimes(1);
        expect(result.current.showEmailModal).toBe(true);
        expect(result.current.emailFormData.body).toBe('Второе письмо');
      });
    });

    // Test 26
    it('releases the latch after a network error and lets the user retry', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('network down')).mockResolvedValue(okResponse());

      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      await act(async () => {
        await result.current.handleEmailSend();
      });

      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      // Not «network down»: the exception of a request that never got through carries the browser's
      // own wording, in the browser's own language, and says nothing the user can act on.
      expect(NotificationManager.error.mock.calls[0][0]).toBe('ai-assistant.notification.email-send-transport-error');
      // The form stays open so the message is not lost.
      expect(result.current.showEmailModal).toBe(true);
      expect(result.current.isEmailSending).toBe(false);

      await act(async () => {
        await result.current.handleEmailSend();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(NotificationManager.success).toHaveBeenCalledTimes(1);
    });

    // Test 27
    it('treats a non-ok response as an error and releases the latch', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(failedResponse(500, { message: 'SMTP is down' }))
        .mockResolvedValue(okResponse());

      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      await act(async () => {
        await result.current.handleEmailSend();
      });

      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      expect(NotificationManager.error.mock.calls[0][0]).toBe('SMTP is down');
      expect(NotificationManager.success).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.handleEmailSend();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('falls back to a generic message when a non-ok response carries no body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: jest.fn().mockRejectedValue(new Error('not a json'))
      });

      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      await act(async () => {
        await result.current.handleEmailSend();
      });

      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      expect(NotificationManager.error.mock.calls[0][0]).toBeTruthy();
      expect(result.current.showEmailModal).toBe(true);
    });

    // Test 28
    it('treats `success: false` in the body as an error', async () => {
      global.fetch = jest.fn().mockResolvedValue(okResponse({ success: false, message: 'Recipient rejected' }));

      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      await act(async () => {
        await result.current.handleEmailSend();
      });

      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      expect(NotificationManager.error.mock.calls[0][0]).toBe('Recipient rejected');
      expect(NotificationManager.success).not.toHaveBeenCalled();
      expect(result.current.showEmailModal).toBe(true);
    });

    // Test 29
    it('toggles isEmailSending for the duration of the request', async () => {
      let resolveFetch;
      global.fetch = jest.fn(
        () =>
          new Promise(resolve => {
            resolveFetch = resolve;
          })
      );

      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      let pending;
      act(() => {
        pending = result.current.handleEmailSend();
      });

      expect(result.current.isEmailSending).toBe(true);

      await act(async () => {
        resolveFetch(okResponse());
        await pending;
      });

      expect(result.current.isEmailSending).toBe(false);
    });

    it('ignores a second click while the request is still in flight', async () => {
      let resolveFetch;
      global.fetch = jest.fn(
        () =>
          new Promise(resolve => {
            resolveFetch = resolve;
          })
      );

      const { result } = renderHook(() => useEmailSend());

      openFilledForm(result);
      let pending;
      act(() => {
        pending = result.current.handleEmailSend();
      });

      // A click landing after the re-render — the button is `disabled`, but a stray call must not
      // start a second request either.
      await act(async () => {
        await result.current.handleEmailSend();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveFetch(okResponse());
        await pending;
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
