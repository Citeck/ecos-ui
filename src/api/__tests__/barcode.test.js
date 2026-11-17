import { BarcodeApi } from '../barcode';

import { getPrintErrorKey } from '@/dto/barcodePrint';

const api = new BarcodeApi();
const args = { record: 'emodel/test@id &x', printSettings: { offsetLeftMm: 0 } };

describe('BarcodeApi.getPrintPdf', () => {
  beforeEach(() => fetch.resetMocks());

  it('uses authenticated ecosFetch and only returns a validated PDF Blob', async () => {
    fetch.mockResponseOnce('%PDF-1.7\nbarcode', { headers: { 'Content-Type': 'application/pdf; charset=binary' } });
    const controller = new AbortController();
    const blob = await api.getPrintPdf({ ...args, signal: controller.signal });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBe(16);
    const [url, options] = fetch.mock.calls[0];
    expect(new URL(url, 'http://localhost').searchParams.get('entityRef')).toBe(args.record);
    expect(options.credentials).toBe('include');
    expect(options.signal).toBe(controller.signal);
    expect(options.headers.Accept).toBe('application/pdf');
  });

  it.each([
    [400, 'fit'],
    [401, 'access'],
    [403, 'access'],
    [404, 'not-found'],
    [500, 'prepare']
  ])('rejects status %i without exposing the body', async (status, key) => {
    fetch.mockResponseOnce('<html>private backend error</html>', { status });
    const error = await api.getPrintPdf(args).catch(error => error);
    expect(error.status).toBe(status);
    expect(error.message).not.toContain('private');
    expect(getPrintErrorKey(error)).toBe(`barcode-widget.print.error.${key}`);
  });

  it.each([
    ['text/html', '<html>login</html>'],
    ['application/pdf', '<html>login</html>'],
    ['application/pdf', ''],
    ['application/pdf', '%PDF'],
    ['application/octet-stream', '%PDF-1.7']
  ])('rejects unexpected type/signature %s %s', async (contentType, body) => {
    fetch.mockResponseOnce(body, { headers: { 'Content-Type': contentType } });
    await expect(api.getPrintPdf(args)).rejects.toThrow();
  });

  it('rejects a network failure with recoverable generic error classification', async () => {
    fetch.mockRejectOnce(new TypeError('Failed to fetch'));
    const error = await api.getPrintPdf(args).catch(error => error);
    expect(error).toBeInstanceOf(TypeError);
    expect(getPrintErrorKey(error)).toBe('barcode-widget.print.error.prepare');
  });

  it('does not request a PDF for invalid settings', async () => {
    await expect(api.getPrintPdf({ ...args, printSettings: { version: 2 } })).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
