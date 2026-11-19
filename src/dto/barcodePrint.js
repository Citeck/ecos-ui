export const defaultPrintSettings = Object.freeze({
  version: 1,
  pageFormat: 'A4',
  scalePercent: 100,
  offsetLeftMm: 20,
  offsetTopMm: 20
});

export const isLegacyBarcodeRecord = record => record.indexOf('workspace://SpacesStore/') !== -1;

export function normalizePrintSettings(source = {}) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return { ...defaultPrintSettings, version: null };
  }

  const settings = Object.fromEntries(
    Object.entries(defaultPrintSettings).map(([key, value]) => [key, source[key] === undefined ? value : source[key]])
  );
  for (const key of ['rasterWidth', 'rasterHeight']) {
    if (source[key] !== undefined) {
      settings[key] = source[key];
    }
  }
  return settings;
}

export function parsePrintNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  if (typeof value !== 'string' || !/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim())) {
    return NaN;
  }
  return Number(value.trim().replace(',', '.'));
}

export function validatePrintSettings(source) {
  const settings = normalizePrintSettings(source);
  const errors = {};
  const { rasterWidth, rasterHeight } = settings;
  const hasRaster = rasterWidth !== undefined || rasterHeight !== undefined;
  if (
    settings.version !== 1 ||
    settings.pageFormat !== 'A4' ||
    (hasRaster &&
      (![rasterWidth, rasterHeight].every(value => Number.isInteger(value) && value > 0 && value <= 4096) ||
        rasterWidth * rasterHeight > 4000000))
  ) {
    errors.schema = 'barcode-widget.print.error.settings';
  }
  for (const [key, limit] of [
    ['scalePercent', Infinity],
    ['offsetLeftMm', 210],
    ['offsetTopMm', 297]
  ]) {
    const value = parsePrintNumber(settings[key]);
    if (!Number.isFinite(value) || value < 0 || (key === 'scalePercent' && value === 0) || value >= limit) {
      errors[key] = `barcode-widget.print.validation.${key}`;
    }
  }
  return errors;
}

export function getPrintGeometry(source) {
  if (Object.keys(validatePrintSettings(source)).length) {
    throw new Error('barcode-widget.print.error.settings');
  }
  const settings = normalizePrintSettings(source);
  return {
    pageWidth: 595.276,
    pageHeight: 841.89,
    printScale: parsePrintNumber(settings.scalePercent) / 100,
    pageMarginLeft: (parsePrintNumber(settings.offsetLeftMm) * 72) / 25.4,
    pageMarginTop: (parsePrintNumber(settings.offsetTopMm) * 72) / 25.4,
    ...(settings.rasterWidth === undefined ? {} : { width: settings.rasterWidth, height: settings.rasterHeight })
  };
}

export function getPrintErrorKey(error) {
  if (error?.status === 400) {
    return 'barcode-widget.print.error.fit';
  }
  if (error?.status === 401 || error?.status === 403) {
    return 'barcode-widget.print.error.access';
  }
  if (error?.status === 404) {
    return 'barcode-widget.print.error.not-found';
  }
  return 'barcode-widget.print.error.prepare';
}
