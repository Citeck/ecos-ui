/**
 * COREDEV-466: the doc-lib worker talks to the Records gateway with raw fetch, so it has to read
 * the `messages` array the same way `@citeck/records-core`'s (unexported) `checkRespMessages`
 * does on the main thread. These pin the extraction rules so the two never drift.
 */
import { getRecordsErrorMessage, readRecordsResponse } from '../recordsResponse';

describe('getRecordsErrorMessage', () => {
  it('returns null when there are no messages or none at ERROR level', () => {
    expect(getRecordsErrorMessage(undefined)).toBeNull();
    expect(getRecordsErrorMessage([])).toBeNull();
    expect(getRecordsErrorMessage([{ level: 'WARN', msg: 'careful' }])).toBeNull();
  });

  it('unwraps a records-error object to its human text', () => {
    const messages = [
      { level: 'INFO', msg: 'ignored' },
      { level: 'ERROR', type: 'records-error', msg: { type: 'EcosWebException', msg: 'Name is taken', stackTrace: [], data: {} } }
    ];
    expect(getRecordsErrorMessage(messages)).toBe('Name is taken');
  });

  it('passes a string msg through and stringifies any other object', () => {
    expect(getRecordsErrorMessage([{ level: 'ERROR', msg: 'plain text' }])).toBe('plain text');
    expect(getRecordsErrorMessage([{ level: 'ERROR', type: 'other', msg: { code: 7 } }])).toBe('{"code":7}');
  });

  it('stringifies a records-error whose msg.msg is itself an object instead of "[object Object]"', () => {
    const msg = { type: 'EcosWebException', msg: { code: 'E42', detail: 'nested' } };
    expect(getRecordsErrorMessage([{ level: 'ERROR', type: 'records-error', msg }])).toBe(JSON.stringify(msg));
  });

  it('falls back to "Server error" when the ERROR entry has no usable text', () => {
    expect(getRecordsErrorMessage([{ level: 'ERROR' }])).toBe('Server error');
    expect(getRecordsErrorMessage([{ level: 'ERROR', type: 'records-error', msg: {} }])).toBe('Server error');
  });
});

describe('readRecordsResponse', () => {
  const response = (body, { ok = true, status = 200 } = {}) => ({
    ok,
    status,
    json: () => (body instanceof Error ? Promise.reject(body) : Promise.resolve(body))
  });

  it('is ok with the parsed body for a clean 200', async () => {
    const result = await readRecordsResponse(response({ records: [{ id: 'x' }] }));
    expect(result).toEqual({ ok: true, errorStatus: undefined, errorMessage: null, body: { records: [{ id: 'x' }] } });
  });

  it('turns a 200 with an ERROR message into not-ok with the text and no errorStatus', async () => {
    const body = { messages: [{ level: 'ERROR', type: 'records-error', msg: { msg: 'boom' } }], records: [] };
    const result = await readRecordsResponse(response(body));
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toBe('boom');
    expect(result.errorStatus).toBeUndefined();
  });

  it('keeps the HTTP status for a non-2xx answer without a records message', async () => {
    const result = await readRecordsResponse(response(new Error('not json'), { ok: false, status: 500 }));
    expect(result).toEqual({ ok: false, errorStatus: 500, errorMessage: null, body: null });
  });

  it('prefers the records message text over the HTTP status when both are present', async () => {
    const body = { messages: [{ level: 'ERROR', msg: 'server text' }] };
    const result = await readRecordsResponse(response(body, { ok: false, status: 500 }));
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toBe('server text');
    expect(result.errorStatus).toBeUndefined();
  });
});
