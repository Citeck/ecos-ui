import { loadTextContent, truncateByBytes } from '../textContent';

const SRC = '/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1';

const respond = ({ status = 200, body = '', headers = {} }) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      status,
      ok: status >= 200 && status < 300,
      headers: { get: name => headers[name] || null },
      text: () => Promise.resolve(body)
    })
  );
};

describe('loadTextContent: what it asks for', () => {
  it('asks for the first maxBytes bytes and nothing more', async () => {
    respond({ body: 'hello' });

    await loadTextContent(SRC, { maxBytes: 2048 });

    expect(global.fetch).toHaveBeenCalledWith(SRC, expect.objectContaining({ headers: { Range: 'bytes=0-2047' } }));
  });

  it('passes the abort signal through', async () => {
    respond({ body: 'hello' });
    const signal = new AbortController().signal;

    await loadTextContent(SRC, { signal });

    expect(global.fetch).toHaveBeenCalledWith(SRC, expect.objectContaining({ signal }));
  });
});

describe('loadTextContent: a server that honours the range', () => {
  it('trusts a 206 of a longer content to be shortened', async () => {
    respond({ status: 206, body: 'abcd', headers: { 'Content-Range': 'bytes 0-3/9000' } });

    expect(await loadTextContent(SRC, { maxBytes: 4 })).toEqual({ content: 'abcd', isTruncated: true });
  });

  /**
   * A range covering the whole content is still answered with a 206, and announcing "shortened,
   * download it to see the rest" there would be a lie.
   */
  it('does not call a 206 shortened when it covers the whole content', async () => {
    respond({ status: 206, body: 'abcd', headers: { 'Content-Range': 'bytes 0-3/4' } });

    expect(await loadTextContent(SRC, { maxBytes: 4 })).toEqual({ content: 'abcd', isTruncated: false });
  });

  it('assumes there is more when the server does not say how much there is', async () => {
    respond({ status: 206, body: 'abcd' });

    expect(await loadTextContent(SRC, { maxBytes: 4 })).toEqual({ content: 'abcd', isTruncated: true });
  });
});

describe('loadTextContent: a server that ignores the range', () => {
  it('cuts a 200 down to size itself', async () => {
    respond({ status: 200, body: 'abcdefghij' });

    expect(await loadTextContent(SRC, { maxBytes: 4 })).toEqual({ content: 'abcd', isTruncated: true });
  });

  it('leaves a 200 that already fits alone', async () => {
    respond({ status: 200, body: 'abcd' });

    expect(await loadTextContent(SRC, { maxBytes: 4 })).toEqual({ content: 'abcd', isTruncated: false });
  });
});

describe('loadTextContent: nothing to show', () => {
  /**
   * An empty content has no byte zero, so the range asked for lies past its end. That is the
   * storage answering honestly, not a failure to show to the user.
   */
  it('shows an empty content for a 416 instead of failing', async () => {
    respond({ status: 416 });

    expect(await loadTextContent(SRC, { maxBytes: 4 })).toEqual({ content: '', isTruncated: false });
  });

  it('fails on any other error status', async () => {
    respond({ status: 500 });

    await expect(loadTextContent(SRC)).rejects.toThrow('HTTP 500');
  });

  it('lets an abort through to the caller', async () => {
    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';
    global.fetch = jest.fn(() => Promise.reject(abortError));

    await expect(loadTextContent(SRC)).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('truncateByBytes', () => {
  it('counts bytes, not characters', () => {
    // each of these is two bytes in utf-8, so four of them do not fit in five bytes
    expect(truncateByBytes('ффф', 4)).toEqual({ content: 'фф', isTruncated: true });
  });

  it('drops a character the cut landed inside of rather than showing it broken', () => {
    expect(truncateByBytes('ффф', 5)).toEqual({ content: 'фф', isTruncated: true });
  });

  it('leaves a text that fits alone', () => {
    expect(truncateByBytes('ффф', 6)).toEqual({ content: 'ффф', isTruncated: false });
  });
});
