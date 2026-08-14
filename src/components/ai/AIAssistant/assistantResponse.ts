/**
 * The one place that knows every shape a finished assistant answer can arrive in.
 *
 * Three services poll the same endpoint and each used to carry its own reading of the payload:
 * `TextAIService` and `AIContentService` held two near-identical copies of the extraction below,
 * while `ScriptAIService` had none at all and rejected everything that was not its own
 * `script_writing` envelope — so a plain-text answer to a question about a script was thrown away
 * and the panel closed with «Unexpected response type from AI» (D-G-QA-DROP, case G14).
 *
 * The backend is free to answer a question with prose instead of an envelope, and that is a valid
 * answer for every one of the three: an envelope is what a *transformation* looks like, not what an
 * answer looks like. Whoever adds a new envelope adds it here once.
 */

/** Reads one field of an unknown object as a string, or reports that it holds none. */
const stringField = (source: unknown, field: string): string | null => {
  if (!source || typeof source !== 'object') {
    return null;
  }
  const value = (source as Record<string, unknown>)[field];
  return typeof value === 'string' && value ? value : null;
};

/**
 * Pulls the human-readable answer out of a payload, whatever wrapping it came in.
 *
 * The parameter is `unknown` on purpose: every caller declares its own envelope interface, and a
 * shared shape here would only mean each of them casting to it. What arrives is whatever the
 * backend sent, and surviving that is the whole job.
 *
 * The order below is from the most specific wrapping to the least, so an envelope that carries both
 * a structured field and a loose one is read by its structured field. Anything with no text at all
 * gives `null` — that, and only that, is what the callers may treat as an unusable answer.
 * @param responseData - `result` of a finished request, in any of its shapes
 * @returns The answer text, or null when the payload carries none
 */
export const extractAnswerText = (responseData: unknown): string | null => {
  if (!responseData) {
    return null;
  }

  if (typeof responseData === 'string') {
    return responseData;
  }

  if (typeof responseData !== 'object') {
    return null;
  }

  const message = (responseData as Record<string, unknown>).message;

  // `content` is last of the four: the other three name the answer, while `content` is also used by
  // envelopes that carry the *subject* of an edit rather than its result.
  const fromEnvelope =
    stringField(message, 'text') ||
    stringField(message, 'generatedText') ||
    stringField(message, 'modifiedText') ||
    stringField(message, 'content');
  if (fromEnvelope) {
    return fromEnvelope;
  }

  if (typeof message === 'string' && message) {
    return message;
  }

  return stringField(responseData, 'text') || stringField(responseData, 'content');
};

export default { extractAnswerText };
