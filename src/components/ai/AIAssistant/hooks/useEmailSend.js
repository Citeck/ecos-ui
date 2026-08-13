import { useState, useRef, useCallback } from 'react';

import { API_ENDPOINTS } from '../constants';
import { stripRecordRefAlias } from '../utils';

import { t } from '@/helpers/export/util';
import { getRecordRef } from '@/helpers/urls';
import { NotificationManager } from '@/services/notifications';

const createEmptyEmailForm = () => ({
  to: '',
  subject: '',
  body: '',
  addToActivities: true
});

/**
 * An error whose text was written for the user — the backend's own wording, or one of ours.
 *
 * The mark is what tells it apart from everything else that can reach the `catch`: a `fetch` that
 * never got through rejects with the browser's own exception, whose `message` is «Failed to fetch»
 * in the browser's own language. Shown under «Ошибка отправки» it says nothing the user can act on
 * and is not even in the language of the interface. The chat's own send path draws the same line
 * (`error.userMessage` in `handleSubmit`).
 * @param {string} message - Text safe to show as is
 * @returns {Error}
 */
const userFacingError = message => {
  const error = new Error(message);
  error.userMessage = message;
  return error;
};

/**
 * Hook owning the whole "send an email drafted by the assistant" flow: the modal visibility, the
 * form values and the request itself.
 *
 * The double-submit guard is a ref, not the `isEmailSending` state, on purpose. React state is
 * applied asynchronously and the value captured by `useCallback` stays frozen until the next
 * render, so two clicks within one render cycle both read `false` and both fire a `POST` — the
 * recipient then gets two identical emails. A ref changes synchronously and is visible to the
 * second handler immediately. `isEmailSending` remains, but only drives the spinner and the
 * `disabled` attribute of the send button.
 *
 * @returns {Object} hook API
 * @returns {boolean} return.showEmailModal - Whether the send form is on screen
 * @returns {boolean} return.isEmailSending - True while the request is in flight (display only)
 * @returns {{to:string,subject:string,body:string,addToActivities:boolean}} return.emailFormData - Current form values
 * @returns {Function} return.handleSendEmail - `(emailData) => void` — fills the form from a message and opens the modal
 * @returns {Function} return.handleEmailModalClose - Closes the modal and resets the form
 * @returns {Function} return.handleEmailFieldChange - `(field, value) => void` — updates a single form field
 * @returns {Function} return.handleEmailSend - `() => Promise<void>` — sends the email; repeated calls while one is in flight are ignored
 */
const useEmailSend = () => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailFormData, setEmailFormData] = useState(createEmptyEmailForm);

  const isSendingRef = useRef(false);
  // Identifies the draft a request belongs to. Closing the modal abandons the current draft, so a
  // request that completes afterwards must not touch the form the user has meanwhile reopened.
  const sendGenerationRef = useRef(0);

  const handleSendEmail = useCallback(emailData => {
    if (emailData) {
      setEmailFormData({
        to: emailData.to || '',
        subject: emailData.subject || '',
        body: emailData.body || '',
        addToActivities: true
      });
      setShowEmailModal(true);
    }
  }, []);

  const handleEmailModalClose = useCallback(() => {
    // The modal can be closed while a request is still in flight — nothing disables the Cancel/×
    // buttons. Releasing the ref together with the state is what keeps the two in step: leaving the
    // ref raised would make the next draft's Send a silent no-op (the guard below returns, the
    // button stays enabled because the state says idle, and the user gets no feedback at all).
    // Bumping the generation retires the abandoned request, so its completion can no longer close
    // the modal and wipe the draft the user has already started composing.
    sendGenerationRef.current += 1;
    isSendingRef.current = false;
    setShowEmailModal(false);
    setIsEmailSending(false);
    setEmailFormData(createEmptyEmailForm());
  }, []);

  const handleEmailFieldChange = useCallback((field, value) => {
    setEmailFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEmailSend = useCallback(async () => {
    // Checked and raised in the very first statement: everything below may yield to another click.
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    const generation = ++sendGenerationRef.current;
    setIsEmailSending(true);

    try {
      // Without the cut the backend resolves no record and the "add to activities" box silently
      // attaches the letter to nothing — see `stripRecordRefAlias`.
      const recordRef = stripRecordRefAlias(getRecordRef());

      const response = await fetch(API_ENDPOINTS.SEND_MAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailFormData,
          recordRef: recordRef || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw userFacingError(errorData.message || t('ai-assistant.notification.email-send-failed-status', { status: response.status }));
      }

      const result = await response.json();
      if (!result.success) {
        throw userFacingError(result.message || t('ai-assistant.notification.email-send-unknown-error'));
      }

      // The email really did go out, so the confirmation is shown even for an abandoned draft — but
      // the form is only reset while this request still owns it. Otherwise a slow first send would
      // close the modal and wipe the second draft the user is typing.
      NotificationManager.success(t('ai-assistant.notification.email-sent'), t('ai-assistant.notification.email-send-title'));
      if (generation === sendGenerationRef.current) {
        handleEmailModalClose();
      }
    } catch (error) {
      // Only text meant for a reader is shown; a transport failure gets a translated message of its
      // own, and the exception itself goes to the console where it is of some use.
      if (!error?.userMessage) {
        console.error('Error sending email:', error);
      }
      NotificationManager.error(
        error?.userMessage || t('ai-assistant.notification.email-send-transport-error'),
        t('ai-assistant.notification.email-send-error-title')
      );
    } finally {
      // Both flags belong to the draft on screen. Once it has been replaced they describe the newer
      // send, and lowering them here would unblock a second `POST` of the message being sent now.
      if (generation === sendGenerationRef.current) {
        isSendingRef.current = false;
        setIsEmailSending(false);
      }
    }
  }, [emailFormData, handleEmailModalClose]);

  return {
    showEmailModal,
    isEmailSending,
    emailFormData,
    handleSendEmail,
    handleEmailModalClose,
    handleEmailFieldChange,
    handleEmailSend
  };
};

export default useEmailSend;
