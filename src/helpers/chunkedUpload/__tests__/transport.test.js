import { requestJson, uploadChunk, uploadFormData } from '../transport';

/**
 * A minimal fake XMLHttpRequest that records what was set on it and lets the
 * test drive its lifecycle events. Exercises the real transport.js (not
 * mocked), so it directly proves the one fact the whole chunk-upload path
 * depends on: an explicit `application/octet-stream` Content-Type header.
 */
class FakeXHR {
  constructor() {
    this.requestHeaders = {};
    this.upload = {};
  }

  open(method, url) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name, value) {
    this.requestHeaders[name] = value;
  }

  send(body) {
    this.sentBody = body;
  }

  respond(status, responseText) {
    this.status = status;
    this.responseText = responseText;
    this.onload();
  }
}

describe('transport', () => {
  let originalXHR;
  let lastXhr;

  beforeEach(() => {
    originalXHR = global.XMLHttpRequest;
    global.XMLHttpRequest = jest.fn(() => {
      lastXhr = new FakeXHR();
      return lastXhr;
    });
  });

  afterEach(() => {
    global.XMLHttpRequest = originalXHR;
  });

  it('uploadChunk sends the blob as a POST with an explicit application/octet-stream Content-Type', () => {
    const blob = new Blob(['chunk-bytes']);

    const { xhr, promise } = uploadChunk({ url: '/upload-session/abc/chunk?offset=0', blob });

    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('/upload-session/abc/chunk?offset=0');
    // The critical fact: a Blob from File.slice() inherits the file's own
    // mime type, so without this explicit header the server answers 415.
    expect(xhr.requestHeaders['Content-Type']).toBe('application/octet-stream');
    expect(xhr.sentBody).toBe(blob);

    xhr.respond(200, JSON.stringify({ offset: 11 }));
    return expect(promise).resolves.toEqual({ status: 200, body: { offset: 11 }, xhr });
  });

  it('requestJson sends a JSON content type only when a body is provided, and parses the response', async () => {
    const { xhr, promise } = requestJson({ url: '/upload-session', method: 'POST', json: { name: 'a.txt' } });

    expect(xhr.requestHeaders['Content-Type']).toBe('application/json;charset=UTF-8');
    expect(xhr.sentBody).toBe(JSON.stringify({ name: 'a.txt' }));

    xhr.respond(200, JSON.stringify({ uploadId: 'x', chunkSize: 10 }));
    await expect(promise).resolves.toEqual({ status: 200, body: { uploadId: 'x', chunkSize: 10 }, xhr });
  });

  it('requestJson treats an empty response body (e.g. 204) as undefined rather than throwing', async () => {
    const { xhr, promise } = requestJson({ url: '/upload-session/abc', method: 'DELETE' });

    expect(xhr.requestHeaders['Content-Type']).toBeUndefined();

    xhr.respond(204, '');
    await expect(promise).resolves.toEqual({ status: 204, body: undefined, xhr });
  });

  it('uploadFormData does not force a Content-Type, letting the browser set the multipart boundary', () => {
    const formData = { size: undefined };
    const { xhr } = uploadFormData({ url: '/content', formData });

    expect(xhr.requestHeaders['Content-Type']).toBeUndefined();
    expect(xhr.sentBody).toBe(formData);
  });

  it('sends X-Requested-With and Accept-Language on every request (relative URL, no withCredentials)', () => {
    const { xhr } = requestJson({ url: '/upload-session/abc', method: 'GET' });

    expect(xhr.requestHeaders['X-Requested-With']).toBe('XMLHttpRequest');
    expect(typeof xhr.requestHeaders['Accept-Language']).toBe('string');
    expect(xhr.requestHeaders['Accept-Language'].length).toBeGreaterThan(0);
    expect(xhr.withCredentials).toBeUndefined();
  });

  it('sets withCredentials for absolute http(s) URLs, matching ecosXhr.js', () => {
    const { xhr } = requestJson({ url: 'https://other-host.example/upload-session/abc', method: 'GET' });

    expect(xhr.withCredentials).toBe(true);
  });

  it('rejects with { networkError: true } on xhr.onerror, and { aborted: true } on xhr.onabort', async () => {
    const chunkReq = uploadChunk({ url: '/x', blob: new Blob(['a']) });
    chunkReq.xhr.onerror();
    await expect(chunkReq.promise).rejects.toEqual({ networkError: true, message: 'network error' });

    const abortReq = uploadChunk({ url: '/x', blob: new Blob(['a']) });
    abortReq.xhr.onabort();
    await expect(abortReq.promise).rejects.toEqual({ aborted: true });
  });
});
