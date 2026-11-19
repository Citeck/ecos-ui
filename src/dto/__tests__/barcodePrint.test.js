import { PROXY_URI } from '@citeck/constants/alfresco';

import BarcodeConverter from '../barcode';
import {
  defaultPrintSettings,
  getPrintGeometry,
  isLegacyBarcodeRecord,
  normalizePrintSettings,
  parsePrintNumber,
  validatePrintSettings
} from '../barcodePrint';

import { getBarcodePrintUrl } from '@/helpers/urls';
import en from '@/i18n/en.json';
import ru from '@/i18n/ru.json';

describe('barcode print settings and URLs', () => {
  it('ships matching nonempty print translations in both supported locales', () => {
    const keys = Object.keys(en).filter(key => key.startsWith('barcode-widget.print.'));
    expect(keys.sort()).toEqual(
      Object.keys(ru)
        .filter(key => key.startsWith('barcode-widget.print.'))
        .sort()
    );
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(en[key].trim()).not.toBe('');
      expect(ru[key].trim()).not.toBe('');
    }
  });

  it('retains optional raster dimensions when going through editable settings and only sends them on opt-in', () => {
    const settings = normalizePrintSettings({ scalePercent: 23.62204724, rasterWidth: 1550, rasterHeight: 300, captionFontSize: 100 });
    const query = new URL(getBarcodePrintUrl('emodel/test@1', settings), 'http://localhost').searchParams;
    expect(query.get('width')).toBe('1550');
    expect(query.get('height')).toBe('300');
    expect(query.get('captionFontSize')).toBe('100');
    expect(getPrintGeometry()).not.toHaveProperty('captionFontSize');
    expect(() => getPrintGeometry({ captionFontSize: 201 })).toThrow();
    expect(Number(query.get('printScale'))).toBeCloseTo(0.2362204724, 10);
    expect(getPrintGeometry()).not.toHaveProperty('width');
    for (const invalid of [{ rasterWidth: 1550 }, { rasterWidth: -1, rasterHeight: 300 }, { rasterWidth: 4096, rasterHeight: 4096 }]) {
      expect(() => getPrintGeometry(invalid)).toThrow();
    }
  });

  it('uses independent modern defaults, not old ignored settings', () => {
    expect(normalizePrintSettings()).toEqual(defaultPrintSettings);
    const config = { settings: { scale: 500, right: 200, bottom: 50 } };
    expect(getPrintGeometry(config.printSettings)).toEqual({
      pageWidth: 595.276,
      pageHeight: 841.89,
      printScale: 1,
      pageMarginLeft: (20 * 72) / 25.4,
      pageMarginTop: (20 * 72) / 25.4
    });
  });
  it('fills missing fields but preserves explicit zero offsets', () => {
    expect(normalizePrintSettings({ offsetLeftMm: 0 })).toEqual({ ...defaultPrintSettings, offsetLeftMm: 0 });
    expect(validatePrintSettings({ offsetLeftMm: 0, offsetTopMm: 0 })).toEqual({});
  });
  it.each(['1.5', '1,5', ' 1,5 '])('parses decimal input %s without stripping punctuation', value => {
    expect(parsePrintNumber(value)).toBe(1.5);
    expect(getPrintGeometry({ scalePercent: value, offsetLeftMm: value }).printScale).toBe(0.015);
    expect(getPrintGeometry({ offsetLeftMm: value }).pageMarginLeft).toBeCloseTo((1.5 * 72) / 25.4, 12);
  });
  it.each(['', ' ', '-5', '0', 'NaN', 'Infinity', NaN, Infinity, null, '1x', '1,2.3'])('rejects invalid scale %s', value => {
    expect(validatePrintSettings({ scalePercent: value }).scalePercent).toBeTruthy();
    expect(() => getPrintGeometry({ scalePercent: value })).toThrow();
  });
  it.each([
    ['offsetLeftMm', 210],
    ['offsetLeftMm', -1],
    ['offsetTopMm', 297],
    ['offsetTopMm', ''],
    ['offsetTopMm', Infinity]
  ])('rejects exhausted or invalid offset %s=%s', (key, value) => {
    expect(validatePrintSettings({ [key]: value })[key]).toBeTruthy();
  });
  it.each([{ version: 2 }, { pageFormat: 'Letter' }, null, 'legacy-string'])(
    'refuses unknown schema %s instead of printing defaults',
    value => {
      expect(validatePrintSettings(value).schema).toBeTruthy();
      expect(() => getPrintGeometry(value)).toThrow();
    }
  );
  it('does not impose an arbitrary scale maximum', () => {
    expect(validatePrintSettings({ scalePercent: 100000 })).toEqual({});
  });
  it('encodes modern record refs, sends full A4 geometry, and leaves raster sizing to the server', () => {
    const record = 'emodel/test@id /?&=ю';
    const url = getBarcodePrintUrl(record, { scalePercent: 150, offsetLeftMm: 0, offsetTopMm: '1,5' });
    expect(url).toContain('entityRef=emodel%2Ftest%40');
    const params = Object.fromEntries(new URL(url, 'http://localhost').searchParams);
    expect(params).toEqual({
      entityRef: record,
      pageWidth: '595.276',
      pageHeight: '841.89',
      printScale: '1.5',
      pageMarginLeft: '0',
      pageMarginTop: String((1.5 * 72) / 25.4),
      print: 'true'
    });
    expect(new URL(getBarcodePrintUrl(record), 'http://localhost').searchParams.get('printScale')).toBe('1');
  });
  it.each(['workspace://SpacesStore/id', 'alfresco/@workspace://SpacesStore/id'])(
    'preserves exact legacy route and serialization for %s',
    record => {
      expect(isLegacyBarcodeRecord(record)).toBe(true);
      expect(getBarcodePrintUrl(record)).toBe(
        `${PROXY_URI}citeck/print/barcode?nodeRef=${record}&barcodeType=code-128&scale=5.0&margins=20,200,20,500&print=true`
      );
      expect(BarcodeConverter.getSettingsForUrl()).toBe('barcodeType=code-128&scale=5&margins=20,200,20,50');
      expect(getBarcodePrintUrl(record, BarcodeConverter.getSettingsForUrl())).toBe(
        `${PROXY_URI}citeck/print/barcode?nodeRef=${record}&barcodeType=code-128&scale=5&margins=20,200,20,50&print=true`
      );
      expect(BarcodeConverter.getSettingsForUrl({ scale: 0, left: 2, right: 3, top: 4, bottom: 5 })).toBe('scale=1&margins=2,3,4,5');
    }
  );
});
