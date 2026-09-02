import fetchMock from 'jest-fetch-mock';

import { recordsQueryFetch } from '../recordsApi';

// COREDEV-466: the gateway reports Records API failures as `messages[{ level: 'ERROR', msg }]`
// inside a 200 response; the text picked from there is what the user eventually sees.
const respond = (messages: any[]) => fetchMock.mockResponseOnce(JSON.stringify({ messages, records: [] }));

const query = () => recordsQueryFetch({ records: ['emodel/type@base'], attributes: ['name'] });

describe('recordsApi checkRespMessages', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('throws the plain string msg', async () => {
    respond([{ level: 'ERROR', msg: 'Plain server text' }]);

    await expect(query()).rejects.toThrow('Plain server text');
  });

  it('unwraps msg.msg of a records-error', async () => {
    respond([
      {
        level: 'ERROR',
        type: 'records-error',
        msg: { type: 'EcosWebException', msg: 'Human readable text', stackTrace: [], data: {} }
      }
    ]);

    await expect(query()).rejects.toThrow('Human readable text');
  });

  it('falls back to JSON for a records-error whose msg.msg is an object', async () => {
    const nested = { type: 'EcosWebException', msg: { code: 'E42', detail: 'nested' } };
    respond([{ level: 'ERROR', type: 'records-error', msg: nested }]);

    const error: Error = await query().catch(e => e);

    expect(error.message).toBe(JSON.stringify(nested));
    expect(error.message).not.toContain('[object Object]');
  });

  it('falls back to a generic text when a records-error has no msg at all', async () => {
    respond([{ level: 'ERROR', type: 'records-error', msg: { type: 'EcosWebException' } }]);

    const error: Error = await query().catch(e => e);

    expect(error.message).not.toContain('[object Object]');
    expect(error.message).toBeTruthy();
  });

  it('does not throw when there are no ERROR messages', async () => {
    respond([{ level: 'WARN', msg: 'ignore me' }]);

    await expect(query()).resolves.toEqual({ messages: [{ level: 'WARN', msg: 'ignore me' }], records: [] });
  });
});
