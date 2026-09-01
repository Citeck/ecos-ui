jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: { get: jest.fn(), queryOne: jest.fn() }
}));

import Records from '@citeck/records-core';

import { DocPreviewApi, normalizePreviewInfo, previewKindByFileName } from '../docPreview';

const RECORD = 'emodel/doc@1';

const mockRecord = ({ info, fileName = 'report', previewPath = '' }) => {
  Records.get.mockImplementation(() => ({
    load: attributes => {
      if (attributes === '_type?id') {
        return Promise.resolve('emodel/type@doc');
      }

      if (attributes === 'contentConfig.previewPath') {
        return Promise.resolve(previewPath);
      }

      return Promise.resolve({ info, fileName, version: '1.0' });
    }
  }));
};

describe('DocPreviewApi.getPreviewLinkByRecord', () => {
  beforeEach(() => jest.clearAllMocks());

  it('leaves the preview link inline', async () => {
    mockRecord({
      info: {
        url: '/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1&att=preview',
        originalUrl: '/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1&att=content',
        ext: 'pdf'
      }
    });

    const link = await DocPreviewApi.getPreviewLinkByRecord(RECORD);

    expect(link).not.toContain('download=');
    expect(link).toEqual('/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1&att=preview&version=1.0');
  });
});

describe('DocPreviewApi.getPreviews', () => {
  beforeEach(() => jest.clearAllMocks());

  it('describes every attached document', async () => {
    Records.queryOne.mockImplementation(() =>
      Promise.resolve({
        documents: [
          {
            recordId: 'emodel/doc@2',
            fileName: 'contract',
            info: { url: '/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@2', ext: 'pdf' }
          },
          { recordId: 'emodel/doc@3', fileName: 'archive', info: null }
        ]
      })
    );

    const [pdfRow, nothingRow] = await DocPreviewApi.getPreviews(RECORD);

    expect(pdfRow.recordId).toEqual('emodel/doc@2');
    expect(pdfRow.fileName).toEqual('contract');
    expect(pdfRow.preview.kind).toEqual('pdf');
    expect(pdfRow.preview.url).toEqual('/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@2');

    expect(nothingRow.recordId).toEqual('emodel/doc@3');
    expect(nothingRow.preview.kind).toEqual('none');
    expect(nothingRow.preview.url).toEqual('');
  });

  it('offers a download for a row the backend has nothing to show for', async () => {
    Records.queryOne.mockImplementation(() =>
      Promise.resolve({ documents: [{ recordId: 'emodel/doc@3', fileName: 'archive', info: null, contentSize: 4096 }] })
    );

    const [row] = await DocPreviewApi.getPreviews(RECORD);

    expect(row.preview.download.link).toContain('emodel/doc@3');
    expect(row.preview.download.link).toContain('download=true');
  });

  it('has nothing to offer for a row that holds no file at all', async () => {
    Records.queryOne.mockImplementation(() =>
      Promise.resolve({ documents: [{ recordId: 'emodel/doc@3', fileName: 'archive', info: null, contentSize: null }] })
    );

    const [row] = await DocPreviewApi.getPreviews(RECORD);

    expect(row.preview.download.link).toEqual('');
  });

  it('does not version the rows, only the document a dashlet is opened on is versioned', async () => {
    Records.queryOne.mockImplementation(() =>
      Promise.resolve({
        documents: [{ recordId: 'emodel/doc@2', fileName: 'contract', info: { url: '/content?ref=emodel/doc@2' } }]
      })
    );

    const [row] = await DocPreviewApi.getPreviews(RECORD);

    expect(row.preview.url).not.toContain('version=');
  });
});

const PREVIEW_URL = '/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1&att=preview';
const ORIGINAL_URL = '/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1&att=content';

describe('normalizePreviewInfo: a backend that sends `kind`', () => {
  const KINDS = ['image', 'pdf', 'text', 'markdown', 'video', 'audio', 'none'];
  const STATUSES = ['ready', 'processing', 'failed', 'unsupported'];

  KINDS.forEach(kind => {
    it(`takes the kind "${kind}" as the backend states it`, () => {
      const info = { kind, status: 'ready', url: PREVIEW_URL, mimeType: 'application/pdf', ext: 'pdf', size: 17 };

      expect(normalizePreviewInfo(info, { fileName: 'report' }).kind).toEqual(kind);
    });
  });

  STATUSES.forEach(status => {
    it(`takes the status "${status}" as the backend states it`, () => {
      const info = { kind: 'none', status, url: '' };

      expect(normalizePreviewInfo(info, { fileName: 'report' }).status).toEqual(status);
    });
  });

  it('describes what is behind the url, not the original', () => {
    const info = {
      kind: 'pdf',
      status: 'ready',
      url: PREVIEW_URL,
      mimeType: 'application/pdf',
      ext: 'pdf',
      size: 12345,
      originalUrl: ORIGINAL_URL,
      originalName: 'report.docx',
      originalExt: 'docx',
      originalMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    const preview = normalizePreviewInfo(info, { fileName: 'report' });

    expect(preview.mimeType).toEqual('application/pdf');
    expect(preview.ext).toEqual('pdf');
    expect(preview.size).toEqual(12345);
  });

  it('reads the legacy lowercase `mimetype` key when the camelCase one is absent', () => {
    const preview = normalizePreviewInfo({ kind: 'image', url: PREVIEW_URL, mimetype: 'image/png' }, { fileName: 'report' });

    expect(preview.mimeType).toEqual('image/png');
  });

  it('has no size when the backend states none', () => {
    expect(normalizePreviewInfo({ kind: 'image', url: PREVIEW_URL }, {}).size).toEqual(0);
  });

  [
    { title: 'text/*', mimeType: 'text/vnd.some-future-format' },
    { title: 'a +json subtype', mimeType: 'application/ld+json' },
    { title: 'a +xml subtype', mimeType: 'application/rss+xml' },
    { title: 'a +yaml subtype', mimeType: 'application/vnd.custom+yaml' }
  ].forEach(({ title, mimeType }) => {
    it(`degrades a kind it does not know to text when the mime type is ${title}`, () => {
      const info = { kind: 'spreadsheet', status: 'ready', url: PREVIEW_URL, mimeType };

      expect(normalizePreviewInfo(info, { fileName: 'report' }).kind).toEqual('text');
    });
  });

  it('degrades a kind it does not know to none when the mime type is not textual', () => {
    const info = { kind: 'hologram', status: 'ready', url: PREVIEW_URL, mimeType: 'application/vnd.ms-excel' };

    expect(normalizePreviewInfo(info, { fileName: 'report' }).kind).toEqual('none');
  });

  it('keeps the stated status while degrading an unknown kind', () => {
    const info = { kind: 'hologram', status: 'processing', url: '', mimeType: 'application/zip' };

    expect(normalizePreviewInfo(info, {}).status).toEqual('processing');
  });
});

describe('normalizePreviewInfo: a backend that sends no `kind` (legacy inference)', () => {
  [
    { title: 'pdf by ext', info: { url: PREVIEW_URL, ext: 'pdf' }, kind: 'pdf' },
    { title: 'pdf by mimetype', info: { url: PREVIEW_URL, mimetype: 'application/pdf' }, kind: 'pdf' },
    { title: 'pdf by a url that ends with it', info: { url: 'https://host/blob/doc.pdf' }, kind: 'pdf' },
    { title: 'markdown by ext', info: { url: PREVIEW_URL, ext: 'md' }, kind: 'markdown' },
    { title: 'markdown by mimetype', info: { url: PREVIEW_URL, mimetype: 'text/markdown' }, kind: 'markdown' },
    // what a mime database answers for a `.md` file it recognized by its bytes, and therefore what
    // the backend stores for one uploaded without a stated type
    { title: 'markdown by the mimetype a sniffer produces', info: { url: PREVIEW_URL, mimetype: 'text/x-web-markdown' }, kind: 'markdown' },
    { title: 'video by mimetype', info: { url: PREVIEW_URL, mimetype: 'video/mp4', ext: 'mp4' }, kind: 'video' },
    { title: 'audio by mimetype', info: { url: PREVIEW_URL, mimetype: 'audio/mpeg', ext: 'mp3' }, kind: 'audio' },
    { title: 'image by mimetype', info: { url: PREVIEW_URL, mimetype: 'image/png' }, kind: 'image' },
    { title: 'image by ext', info: { url: PREVIEW_URL, ext: 'jpeg' }, kind: 'image' },
    { title: 'text by ext', info: { url: PREVIEW_URL, ext: 'txt' }, kind: 'text' },
    { title: 'text by an ext of the legacy list', info: { url: PREVIEW_URL, ext: 'yml' }, kind: 'text' },
    { title: 'text by a url that ends with such an ext', info: { url: 'https://host/blob/app.log' }, kind: 'text' },
    { title: 'anything else with a url stays the image the old ui showed', info: { url: PREVIEW_URL }, kind: 'image' },
    { title: 'nothing at all is nothing to show', info: {}, kind: 'none' },
    { title: 'no info at all is nothing to show', info: null, kind: 'none' },
    { title: 'the original is what is shown when there is no rendition', info: { originalUrl: ORIGINAL_URL }, kind: 'image' }
  ].forEach(({ title, info, kind }) => {
    it(title, () => {
      expect(normalizePreviewInfo(info, { fileName: 'report' }).kind).toEqual(kind);
    });
  });

  it('reads markdown before text: `md` is not in the legacy text list either way', () => {
    const info = { url: PREVIEW_URL, ext: 'md', mimetype: 'text/markdown' };

    expect(normalizePreviewInfo(info, { fileName: 'report' }).kind).toEqual('markdown');
  });

  it('is ready when there is something to show', () => {
    expect(normalizePreviewInfo({ url: PREVIEW_URL, ext: 'pdf' }, {}).status).toEqual('ready');
  });

  it('is unsupported when there is nothing to show', () => {
    expect(normalizePreviewInfo({}, {}).status).toEqual('unsupported');
  });
});

describe('normalizePreviewInfo: the preview url', () => {
  it('stamps the asked for version on the url (ECOSUI-415)', () => {
    const preview = normalizePreviewInfo({ url: PREVIEW_URL, ext: 'pdf' }, { fileName: 'report', version: '1.0' });

    expect(preview.url).toEqual(`${PREVIEW_URL}&version=1.0`);
  });

  it('leaves the url alone when no version is asked for', () => {
    const preview = normalizePreviewInfo({ url: PREVIEW_URL, ext: 'pdf' }, { fileName: 'report' });

    expect(preview.url).toEqual(PREVIEW_URL);
  });

  it('shows the original when there is no rendition', () => {
    const preview = normalizePreviewInfo({ originalUrl: ORIGINAL_URL }, {});

    expect(preview.url).toEqual(ORIGINAL_URL);
  });

  it('is never asked to be saved: a preview is shown inline', () => {
    const preview = normalizePreviewInfo({ url: PREVIEW_URL, ext: 'pdf' }, { fileName: 'report', version: '1.0' });

    expect(preview.url).not.toContain('download=');
  });

  it('routes an alfresco url through the proxy', () => {
    const preview = normalizePreviewInfo({ url: 'alfresco/citeck/node/1/content' }, {});

    expect(preview.url).toEqual('/gateway/alfresco/alfresco/s/citeck/node/1/content');
  });
});

describe('normalizePreviewInfo: the download', () => {
  it('asks the content endpoint for an attachment', () => {
    const preview = normalizePreviewInfo({ url: PREVIEW_URL, originalUrl: ORIGINAL_URL }, { recordRef: RECORD });

    expect(preview.download.link).toEqual(`${ORIGINAL_URL}&download=true`);
  });

  it('falls back to the shown url when the backend named no original', () => {
    const preview = normalizePreviewInfo({ url: PREVIEW_URL }, { recordRef: RECORD });

    expect(preview.download.link).toEqual(`${PREVIEW_URL}&download=true`);
  });

  it('falls back to the content endpoint of the record when the backend named nothing', () => {
    const preview = normalizePreviewInfo({ kind: 'none', status: 'unsupported' }, { recordRef: RECORD, hasContent: true });

    expect(preview.download.link).toEqual('/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1&download=true');
  });

  /**
   * "This format has no preview" and "there is nothing here" look the same to a backend that stays
   * silent about what it cannot show, and only one of them has a file to hand over.
   */
  it('offers nothing for a record that holds no file at all', () => {
    const preview = normalizePreviewInfo({ kind: 'none', status: 'unsupported' }, { recordRef: RECORD, hasContent: false });

    expect(preview.download.link).toEqual('');
  });

  it('has nothing to offer when there is no record to ask for either', () => {
    expect(normalizePreviewInfo({}, {}).download.link).toEqual('');
  });

  it('keeps an alfresco url as is: it has its own disposition convention', () => {
    const preview = normalizePreviewInfo({ originalUrl: 'alfresco/citeck/node/1/content' }, { recordRef: RECORD });

    expect(preview.download.link).toEqual('/gateway/alfresco/alfresco/s/citeck/node/1/content');
  });

  it('names the file after the original, not after the rendition', () => {
    const info = { url: PREVIEW_URL, ext: 'pdf', originalUrl: ORIGINAL_URL, originalName: 'report', originalExt: 'docx' };

    expect(normalizePreviewInfo(info, { fileName: 'ignored' }).download.fileName).toEqual('report.docx');
  });

  it('does not repeat an extension the original name already carries', () => {
    const info = { originalUrl: ORIGINAL_URL, originalName: 'report.docx', originalExt: 'docx' };

    expect(normalizePreviewInfo(info, { fileName: 'ignored' }).download.fileName).toEqual('report.docx');
  });

  it('falls back to the display name of the record', () => {
    const info = { originalUrl: ORIGINAL_URL, originalExt: 'docx' };

    expect(normalizePreviewInfo(info, { fileName: 'report' }).download.fileName).toEqual('report.docx');
  });

  it('leaves the name alone when the backend named no extension', () => {
    const info = { originalUrl: ORIGINAL_URL, originalName: 'report' };

    expect(normalizePreviewInfo(info, { fileName: 'ignored' }).download.fileName).toEqual('report');
  });
});

/**
 * The legacy branch of the normalizer, reached only for a backend that names neither the extension
 * nor the mime type, and for a url a dashlet was configured with by hand. Cases moved here from
 * `src/helpers/__tests__/util.test.js` together with the predicates themselves, and asked through
 * the normalizer, which is the only thing allowed to call them.
 */
describe('normalizePreviewInfo: a url and nothing else', () => {
  const kindOf = url => normalizePreviewInfo({ url }).kind;

  it('has nothing to show without a url', () => {
    expect(normalizePreviewInfo({ url: '' }).kind).toEqual('none');
    expect(normalizePreviewInfo(null).kind).toEqual('none');
  });

  it('reads a pdf out of the url', () => {
    expect(kindOf('https://host/files/doc.pdf')).toEqual('pdf');
  });

  it('reads every extension of the legacy text list out of the url', () => {
    ['foo.txt', 'app.log', 'archive.har', 'data.csv', 'config.xml', 'page.html', 'data.json', 'config.yaml', 'config.yml'].forEach(name => {
      expect(kindOf(`https://host/files/${name}`)).toEqual('text');
    });
  });

  it('does not care about the case of the extension', () => {
    expect(kindOf('https://host/files/FILE.LOG')).toEqual('text');
  });

  it('shows anything else it has a url for as a picture, as this ui has always done', () => {
    expect(kindOf('https://host/files/foo.png')).toEqual('image');
    expect(kindOf('https://host/blob/abc123')).toEqual('image');
  });

  /**
   * Why the normalizer asks the extension and the mime type first and the url last: a url is the
   * last resort, and this is what it costs when it is all there is.
   */
  it('cannot see a pdf behind anything appended to the url', () => {
    expect(kindOf('https://host/files/doc.pdf?version=1.0')).toEqual('image');
  });
});

describe('previewKindByFileName', () => {
  [
    { name: 'photo.jpg', kind: 'image' },
    { name: 'photo.JPEG', kind: 'image' },
    { name: 'shot.png', kind: 'image' },
    { name: 'clip.mp4', kind: 'video' },
    { name: 'clip.webm', kind: 'video' },
    { name: 'song.mp3', kind: 'audio' },
    { name: 'song.wav', kind: 'audio' },
    { name: 'report.pdf', kind: 'pdf' },
    { name: 'notes.md', kind: 'markdown' },
    { name: 'app.log', kind: 'text' },
    { name: 'report.docx', kind: 'none' },
    { name: 'archive', kind: 'none' },
    { name: '', kind: 'none' }
  ].forEach(({ name, kind }) => {
    it(`reads "${name}" as ${kind}`, () => {
      expect(previewKindByFileName(name)).toEqual(kind);
    });
  });
});
