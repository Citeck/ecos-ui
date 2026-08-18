/**
 * A refusal of an AI request, carrying the reason the server actually gave.
 *
 * D-G-400-SILENT (regr-20260816-r1, G15): the field services threw
 * `new Error('Request failed: ' + status)` and never looked at the body, so the backend's request
 * validator (`ChatRequestValidator`) could refuse a request with a fully localized explanation —
 * «Текст для редактирования слишком большой (262144 символов, максимум 100000). Разделите его на
 * части…» — and the user would see the AI panel simply disappear. The only trace was
 * `Request failed: 400` in the console: the status code, not the reason.
 *
 * `userMessage` is set only when the body actually names a reason. Its absence is meaningful: the
 * caller falls back to the generic notification, which is the right answer for a refusal that
 * explains nothing (a gateway page, an empty 500).
 */
export interface AIRequestError extends Error {
  status?: number;
  userMessage?: string;
}

const readReason = async (response: Response): Promise<string | undefined> => {
  try {
    // Not `response.text()` — a refusal body is JSON, and its `error` field is the localized
    // sentence. `message` is accepted as well: Spring's own error shape uses it, and a refusal
    // rendered by the framework rather than by the validator is still worth showing.
    const body = await response.json?.();
    const reason = body?.error ?? body?.message;
    return typeof reason === 'string' && reason.trim() ? reason.trim() : undefined;
  } catch (error) {
    // No body, or not JSON. Nothing to show — and nothing worth reporting either: the status code
    // travels on the error below regardless.
    return undefined;
  }
};

/**
 * Builds the error to throw for a non-ok response, reading the server's reason out of the body.
 * The message stays technical (`Request failed: 400`) — it is what goes to the console; the
 * user-facing half is `userMessage`.
 */
export const buildRequestError = async (response: Response): Promise<AIRequestError> => {
  const userMessage = await readReason(response);
  const error = new Error(`Request failed: ${response.status}`) as AIRequestError;
  error.status = response.status;
  if (userMessage) {
    error.userMessage = userMessage;
  }
  return error;
};
