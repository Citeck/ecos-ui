import {
  FILE_UPLOAD_WHITELIST,
  FILE_UPLOAD_BLOCKLIST,
  FILE_UPLOAD_LIMITS,
  getFileExtension,
  buildAcceptString,
  isExtensionAllowed,
  isExtensionBlocked,
  isBlockedMimeType,
  isAllowedDraggedMimeType,
  hasValidDraggedFile
} from '../constants';

describe('FILE_UPLOAD_WHITELIST', () => {
  it('exposes documents/images/tables/presentations/text_code/existing groups', () => {
    expect(FILE_UPLOAD_WHITELIST).toEqual(
      expect.objectContaining({
        documents: expect.any(Array),
        images: expect.any(Array),
        tables: expect.any(Array),
        presentations: expect.any(Array),
        text_code: expect.any(Array),
        existing: expect.any(Array)
      })
    );
  });

  it('includes expected baseline extensions', () => {
    expect(FILE_UPLOAD_WHITELIST.documents).toEqual(expect.arrayContaining(['.pdf', '.doc', '.docx', '.txt', '.rtf']));
    expect(FILE_UPLOAD_WHITELIST.images).toEqual(expect.arrayContaining(['.png', '.jpg', '.jpeg']));
    expect(FILE_UPLOAD_WHITELIST.tables).toEqual(expect.arrayContaining(['.xlsx', '.csv']));
    expect(FILE_UPLOAD_WHITELIST.presentations).toEqual(expect.arrayContaining(['.pptx']));
    expect(FILE_UPLOAD_WHITELIST.text_code).toEqual(expect.arrayContaining(['.json', '.xml']));
    expect(FILE_UPLOAD_WHITELIST.existing).toEqual(expect.arrayContaining(['.bpmn']));
  });
});

describe('FILE_UPLOAD_BLOCKLIST', () => {
  it('exposes executables/archives/media/svg groups', () => {
    expect(FILE_UPLOAD_BLOCKLIST).toEqual(
      expect.objectContaining({
        executables: expect.any(Array),
        archives: expect.any(Array),
        media: expect.any(Array),
        svg: expect.any(Array)
      })
    );
  });

  it('includes critical blocked extensions', () => {
    expect(FILE_UPLOAD_BLOCKLIST.executables).toEqual(expect.arrayContaining(['.exe', '.bat', '.sh']));
    expect(FILE_UPLOAD_BLOCKLIST.archives).toEqual(expect.arrayContaining(['.zip', '.rar']));
    expect(FILE_UPLOAD_BLOCKLIST.media).toEqual(expect.arrayContaining(['.mp3', '.mp4']));
    expect(FILE_UPLOAD_BLOCKLIST.svg).toEqual(expect.arrayContaining(['.svg']));
  });
});

describe('FILE_UPLOAD_LIMITS', () => {
  it('defines per-file/per-batch/total/name limits', () => {
    expect(FILE_UPLOAD_LIMITS).toEqual({
      maxFileSizeMb: 10,
      maxFilesPerUpload: 5,
      maxTotalSizeMb: 50,
      maxFileNameLength: 200
    });
  });
});

describe('getFileExtension', () => {
  it('returns lower-case extension with leading dot', () => {
    expect(getFileExtension('photo.JPG')).toBe('.jpg');
    expect(getFileExtension('report.PDF')).toBe('.pdf');
  });

  it('handles filenames without extension', () => {
    expect(getFileExtension('Makefile')).toBe('');
    expect(getFileExtension('README')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(getFileExtension('')).toBe('');
  });

  it('handles null/undefined safely', () => {
    expect(getFileExtension(null)).toBe('');
    expect(getFileExtension(undefined)).toBe('');
  });

  it('returns the last extension for filenames with multiple dots', () => {
    expect(getFileExtension('archive.tar.gz')).toBe('.gz');
    expect(getFileExtension('my.file.name.docx')).toBe('.docx');
  });

  it('returns empty string for hidden files without extension', () => {
    // ".gitignore" — name starts with dot, but no extension after a name part
    expect(getFileExtension('.gitignore')).toBe('');
  });

  it('treats trailing dot as no extension', () => {
    expect(getFileExtension('file.')).toBe('');
  });
});

describe('buildAcceptString', () => {
  it('joins all extensions across whitelist groups separated by comma', () => {
    const groups = {
      a: ['.pdf', '.doc'],
      b: ['.png', '.jpg']
    };
    expect(buildAcceptString(groups)).toBe('.pdf,.doc,.png,.jpg');
  });

  it('deduplicates extensions appearing in multiple groups', () => {
    const groups = {
      a: ['.pdf', '.txt'],
      b: ['.txt', '.png']
    };
    expect(buildAcceptString(groups)).toBe('.pdf,.txt,.png');
  });

  it('normalises extensions to lower-case', () => {
    const groups = { a: ['.PDF', '.JPG'] };
    expect(buildAcceptString(groups)).toBe('.pdf,.jpg');
  });

  it('returns empty string for empty groups', () => {
    expect(buildAcceptString({})).toBe('');
    expect(buildAcceptString({ a: [], b: [] })).toBe('');
  });

  it('safely handles null/undefined input', () => {
    expect(buildAcceptString(null)).toBe('');
    expect(buildAcceptString(undefined)).toBe('');
  });

  it('works with the actual FILE_UPLOAD_WHITELIST', () => {
    const accept = buildAcceptString(FILE_UPLOAD_WHITELIST);
    expect(accept).toContain('.pdf');
    expect(accept).toContain('.png');
    expect(accept).toContain('.xlsx');
    expect(accept).toContain('.bpmn');
    expect(accept).not.toContain('.exe');
  });
});

describe('isExtensionAllowed', () => {
  const groups = {
    documents: ['.pdf', '.docx'],
    images: ['.png', '.jpg']
  };

  it('returns true when extension is in any whitelist group', () => {
    expect(isExtensionAllowed('report.pdf', groups)).toBe(true);
    expect(isExtensionAllowed('photo.png', groups)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isExtensionAllowed('IMG.JPG', groups)).toBe(true);
    expect(isExtensionAllowed('REPORT.PDF', groups)).toBe(true);
  });

  it('returns false when extension is not whitelisted', () => {
    expect(isExtensionAllowed('archive.zip', groups)).toBe(false);
    expect(isExtensionAllowed('script.exe', groups)).toBe(false);
  });

  it('returns false for files without extension', () => {
    expect(isExtensionAllowed('Makefile', groups)).toBe(false);
    expect(isExtensionAllowed('', groups)).toBe(false);
  });

  it('returns false for null/undefined filename', () => {
    expect(isExtensionAllowed(null, groups)).toBe(false);
    expect(isExtensionAllowed(undefined, groups)).toBe(false);
  });

  it('returns false when whitelist is empty/missing', () => {
    expect(isExtensionAllowed('report.pdf', {})).toBe(false);
    expect(isExtensionAllowed('report.pdf', null)).toBe(false);
  });
});

describe('isExtensionBlocked', () => {
  const blocklist = {
    executables: ['.exe', '.bat'],
    svg: ['.svg']
  };

  it('returns true when extension is in any blocklist group', () => {
    expect(isExtensionBlocked('virus.exe', blocklist)).toBe(true);
    expect(isExtensionBlocked('icon.svg', blocklist)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isExtensionBlocked('VIRUS.EXE', blocklist)).toBe(true);
    expect(isExtensionBlocked('Icon.SVG', blocklist)).toBe(true);
  });

  it('returns false when extension is not blocked', () => {
    expect(isExtensionBlocked('report.pdf', blocklist)).toBe(false);
    expect(isExtensionBlocked('photo.png', blocklist)).toBe(false);
  });

  it('returns false for files without extension', () => {
    expect(isExtensionBlocked('Makefile', blocklist)).toBe(false);
    expect(isExtensionBlocked('', blocklist)).toBe(false);
  });

  it('returns false for null/undefined filename', () => {
    expect(isExtensionBlocked(null, blocklist)).toBe(false);
    expect(isExtensionBlocked(undefined, blocklist)).toBe(false);
  });

  it('returns false when blocklist is empty/missing', () => {
    expect(isExtensionBlocked('virus.exe', {})).toBe(false);
    expect(isExtensionBlocked('virus.exe', null)).toBe(false);
  });
});

describe('isBlockedMimeType', () => {
  it('blocks audio/* and video/*', () => {
    expect(isBlockedMimeType('audio/mpeg')).toBe(true);
    expect(isBlockedMimeType('audio/wav')).toBe(true);
    expect(isBlockedMimeType('video/mp4')).toBe(true);
    expect(isBlockedMimeType('video/webm')).toBe(true);
  });

  it('blocks image/svg+xml (XSS protection)', () => {
    expect(isBlockedMimeType('image/svg+xml')).toBe(true);
  });

  it('blocks executable MIME types', () => {
    expect(isBlockedMimeType('application/x-msdownload')).toBe(true);
    expect(isBlockedMimeType('application/x-msdos-program')).toBe(true);
    expect(isBlockedMimeType('application/vnd.microsoft.portable-executable')).toBe(true);
  });

  it('blocks archive MIME types', () => {
    expect(isBlockedMimeType('application/zip')).toBe(true);
    expect(isBlockedMimeType('application/x-rar-compressed')).toBe(true);
    expect(isBlockedMimeType('application/x-7z-compressed')).toBe(true);
    expect(isBlockedMimeType('application/gzip')).toBe(true);
  });

  it('does not block whitelisted document/image MIME types', () => {
    expect(isBlockedMimeType('application/pdf')).toBe(false);
    expect(isBlockedMimeType('image/png')).toBe(false);
    expect(isBlockedMimeType('image/jpeg')).toBe(false);
    expect(isBlockedMimeType('text/plain')).toBe(false);
    expect(isBlockedMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isBlockedMimeType('AUDIO/MPEG')).toBe(true);
    expect(isBlockedMimeType('Image/SVG+XML')).toBe(true);
  });

  it('returns false for empty / null / non-string input', () => {
    expect(isBlockedMimeType('')).toBe(false);
    expect(isBlockedMimeType(null)).toBe(false);
    expect(isBlockedMimeType(undefined)).toBe(false);
    expect(isBlockedMimeType(123)).toBe(false);
  });
});

describe('isAllowedDraggedMimeType', () => {
  it('allows image/* (except svg+xml which is blocked)', () => {
    expect(isAllowedDraggedMimeType('image/png')).toBe(true);
    expect(isAllowedDraggedMimeType('image/jpeg')).toBe(true);
    expect(isAllowedDraggedMimeType('image/gif')).toBe(true);
    expect(isAllowedDraggedMimeType('image/webp')).toBe(true);
    expect(isAllowedDraggedMimeType('image/svg+xml')).toBe(false);
  });

  it('allows whitelisted document/table/presentation/text MIME types', () => {
    expect(isAllowedDraggedMimeType('application/pdf')).toBe(true);
    expect(isAllowedDraggedMimeType('application/msword')).toBe(true);
    expect(isAllowedDraggedMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    expect(isAllowedDraggedMimeType('application/vnd.ms-excel')).toBe(true);
    expect(isAllowedDraggedMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
    expect(isAllowedDraggedMimeType('text/csv')).toBe(true);
    expect(isAllowedDraggedMimeType('text/plain')).toBe(true);
    expect(isAllowedDraggedMimeType('application/json')).toBe(true);
  });

  it('treats empty MIME and application/octet-stream as permissive (e.g., .bpmn, .yaml)', () => {
    expect(isAllowedDraggedMimeType('')).toBe(true);
    expect(isAllowedDraggedMimeType('application/octet-stream')).toBe(true);
  });

  it('rejects non-empty MIMEs that are neither whitelisted nor permissive', () => {
    // Codex finding 2: previously these slipped through because the filter
    // was blocklist-only. They are not whitelisted, so the drop-zone must
    // not highlight for them.
    expect(isAllowedDraggedMimeType('application/javascript')).toBe(false);
    expect(isAllowedDraggedMimeType('text/javascript')).toBe(false);
    expect(isAllowedDraggedMimeType('text/x-python')).toBe(false);
    expect(isAllowedDraggedMimeType('application/x-perl')).toBe(false);
  });

  it('rejects explicitly blocked MIME types', () => {
    expect(isAllowedDraggedMimeType('application/x-msdownload')).toBe(false);
    expect(isAllowedDraggedMimeType('application/zip')).toBe(false);
    expect(isAllowedDraggedMimeType('audio/mpeg')).toBe(false);
    expect(isAllowedDraggedMimeType('video/mp4')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isAllowedDraggedMimeType('IMAGE/PNG')).toBe(true);
    expect(isAllowedDraggedMimeType('Application/PDF')).toBe(true);
    expect(isAllowedDraggedMimeType('Application/JavaScript')).toBe(false);
  });

  it('returns false for null/undefined/non-string input', () => {
    expect(isAllowedDraggedMimeType(null)).toBe(false);
    expect(isAllowedDraggedMimeType(undefined)).toBe(false);
    expect(isAllowedDraggedMimeType(123)).toBe(false);
  });
});

describe('hasValidDraggedFile', () => {
  const fileItem = type => ({ kind: 'file', type });
  const stringItem = type => ({ kind: 'string', type });

  it('returns true when all items are files with valid MIME types', () => {
    const items = [fileItem('image/png'), fileItem('application/pdf')];
    expect(hasValidDraggedFile(items)).toBe(true);
  });

  it('returns false when all items are files with blocked MIME types', () => {
    const items = [fileItem('application/x-msdownload'), fileItem('image/svg+xml'), fileItem('audio/mpeg')];
    expect(hasValidDraggedFile(items)).toBe(false);
  });

  it('returns false when files are not whitelisted MIME (e.g. application/javascript, text/x-python)', () => {
    // Even though these MIMEs are not in the executables/archives blocklist,
    // they are not in our whitelist either — drop-zone must not highlight.
    const items = [fileItem('application/javascript'), fileItem('text/x-python')];
    expect(hasValidDraggedFile(items)).toBe(false);
  });

  it('returns true when at least one file has a valid MIME (mixed)', () => {
    const items = [fileItem('application/x-msdownload'), fileItem('image/png')];
    expect(hasValidDraggedFile(items)).toBe(true);
  });

  it('returns false when items contain only non-file kinds (e.g. text/plain string)', () => {
    const items = [stringItem('text/plain'), stringItem('text/uri-list')];
    expect(hasValidDraggedFile(items)).toBe(false);
  });

  it('returns false for empty items list', () => {
    expect(hasValidDraggedFile([])).toBe(false);
  });

  it('returns false when items is null/undefined', () => {
    expect(hasValidDraggedFile(null)).toBe(false);
    expect(hasValidDraggedFile(undefined)).toBe(false);
  });

  it('treats empty MIME as permissive (e.g., .bpmn) — final check is on drop via validateFile', () => {
    const items = [fileItem('')];
    expect(hasValidDraggedFile(items)).toBe(true);
  });

  it('works with array-like DataTransferItemList (indexed access + length)', () => {
    const dataTransferItemList = {
      length: 2,
      0: fileItem('application/x-msdownload'),
      1: fileItem('image/png')
    };
    expect(hasValidDraggedFile(dataTransferItemList)).toBe(true);
  });

  it('ignores non-file items when evaluating files (string + valid file → true)', () => {
    const items = [stringItem('text/plain'), fileItem('application/pdf')];
    expect(hasValidDraggedFile(items)).toBe(true);
  });

  it('ignores non-file items even when only blocked file is present (string + blocked → false)', () => {
    const items = [stringItem('text/plain'), fileItem('image/svg+xml')];
    expect(hasValidDraggedFile(items)).toBe(false);
  });
});
