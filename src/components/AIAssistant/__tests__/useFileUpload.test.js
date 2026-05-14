import { renderHook, act } from '@testing-library/react';

import { FILE_UPLOAD_LIMITS } from '../constants';
import useFileUpload from '../hooks/useFileUpload';

import ecosXhr from '@/helpers/ecosXhr';
import { NotificationManager } from '@/services/notifications';

jest.mock('@/helpers/ecosXhr', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('@/services/notifications', () => ({
  NotificationManager: {
    error: jest.fn()
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const makeFile = (name, sizeBytes = 100, type = '') => ({
  name,
  size: sizeBytes,
  type
});

describe('useFileUpload', () => {
  describe('validateFile', () => {
    let validateFile;

    beforeEach(() => {
      const { result } = renderHook(() => useFileUpload());
      validateFile = result.current.validateFile;
    });

    it('rejects .exe with blocklist message mentioning the extension', () => {
      const result = validateFile(makeFile('virus.exe', 100));
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/\.exe/);
      expect(result.error).toMatch(/не поддерживаются/i);
    });

    it('rejects uppercase blocklisted extension (.EXE)', () => {
      const result = validateFile(makeFile('VIRUS.EXE', 100));
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/\.exe/);
    });

    it('rejects .svg as blocklisted (XSS protection)', () => {
      const result = validateFile(makeFile('icon.svg', 100));
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/\.svg/);
      expect(result.error).toMatch(/не поддерживаются/i);
    });

    it('rejects .zip (archives blocklist)', () => {
      const result = validateFile(makeFile('archive.zip', 100));
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/\.zip/);
    });

    it('rejects extension not present in any whitelist group', () => {
      const result = validateFile(makeFile('strange.xyz', 100));
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/неподдерживаемый тип/i);
      expect(result.error).toMatch(/\.xyz/);
    });

    it('rejects file with no extension', () => {
      const result = validateFile(makeFile('Makefile', 100));
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/неподдерживаемый тип/i);
    });

    it('rejects file larger than maxFileSizeMb with filename, size and limit', () => {
      const oversize = makeFile('report.pdf', 12 * 1024 * 1024);
      const result = validateFile(oversize);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/report\.pdf/);
      expect(result.error).toMatch(/12/);
      expect(result.error).toMatch(/10/);
      expect(result.error).toMatch(/MB/i);
    });

    it('accepts file exactly at maxFileSizeMb limit', () => {
      const atLimit = makeFile('exact.pdf', FILE_UPLOAD_LIMITS.maxFileSizeMb * 1024 * 1024);
      const result = validateFile(atLimit);
      expect(result.valid).toBe(true);
    });

    it('rejects empty (0-byte) file as empty/directory', () => {
      const result = validateFile(makeFile('empty.pdf', 0));
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/пуст|папка/i);
    });

    it('rejects filename longer than maxFileNameLength', () => {
      const longBase = 'a'.repeat(FILE_UPLOAD_LIMITS.maxFileNameLength);
      const longName = `${longBase}.pdf`;
      const result = validateFile(makeFile(longName, 100));
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/имя файла слишком длинное/i);
      expect(result.error).toMatch(String(FILE_UPLOAD_LIMITS.maxFileNameLength));
    });

    it('accepts a filename at exactly maxFileNameLength', () => {
      const exact = 'a'.repeat(FILE_UPLOAD_LIMITS.maxFileNameLength - 4) + '.pdf';
      const result = validateFile(makeFile(exact, 100));
      expect(result.valid).toBe(true);
    });

    it('accepts a valid PDF in whitelist', () => {
      expect(validateFile(makeFile('doc.pdf', 1024)).valid).toBe(true);
    });

    it('accepts a PNG (new image whitelist)', () => {
      expect(validateFile(makeFile('photo.png', 1024)).valid).toBe(true);
    });

    it('accepts an XLSX (new tables whitelist)', () => {
      expect(validateFile(makeFile('budget.xlsx', 1024)).valid).toBe(true);
    });

    it('accepts existing .bpmn extension (backward compatibility)', () => {
      expect(validateFile(makeFile('process.bpmn', 1024)).valid).toBe(true);
    });

    it('blocklist takes precedence over whitelist (e.g., a hypothetical mp3 would be blocked even if not whitelisted)', () => {
      const result = validateFile(makeFile('song.mp3', 100));
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/\.mp3/);
      expect(result.error).toMatch(/не поддерживаются/i);
    });
  });

  describe('validateBatch', () => {
    let validateBatch;

    beforeEach(() => {
      const { result } = renderHook(() => useFileUpload());
      validateBatch = result.current.validateBatch;
    });

    it('accepts a batch of valid files within all limits', () => {
      const files = [makeFile('a.pdf', 1024), makeFile('b.pdf', 1024)];
      expect(validateBatch(files, []).valid).toBe(true);
    });

    it('accepts an empty file list (no-op)', () => {
      expect(validateBatch([], []).valid).toBe(true);
    });

    it('rejects when batch length exceeds maxFilesPerUpload', () => {
      const files = Array.from({ length: FILE_UPLOAD_LIMITS.maxFilesPerUpload + 1 }, (_, i) => makeFile(`file-${i}.pdf`, 1024));
      const result = validateBatch(files, []);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(new RegExp(String(FILE_UPLOAD_LIMITS.maxFilesPerUpload)));
      expect(result.error).toMatch(/файл/i);
    });

    it('accepts exactly maxFilesPerUpload files (boundary)', () => {
      const files = Array.from({ length: FILE_UPLOAD_LIMITS.maxFilesPerUpload }, (_, i) => makeFile(`file-${i}.pdf`, 1024));
      expect(validateBatch(files, []).valid).toBe(true);
    });

    it('rejects when sum of new file sizes exceeds maxTotalSizeMb', () => {
      const oneMb = 1024 * 1024;
      const files = [makeFile('a.pdf', 30 * oneMb), makeFile('b.pdf', 25 * oneMb)];
      const result = validateBatch(files, []);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(new RegExp(String(FILE_UPLOAD_LIMITS.maxTotalSizeMb)));
      expect(result.error).toMatch(/MB/i);
    });

    it('rejects when new sizes plus alreadyUploaded sizes exceed maxTotalSizeMb', () => {
      const oneMb = 1024 * 1024;
      const alreadyUploaded = [{ name: 'old1.pdf', size: 40 * oneMb, recordRef: 'emodel/temp-file@1' }];
      const files = [makeFile('new.pdf', 15 * oneMb)];
      const result = validateBatch(files, alreadyUploaded);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(new RegExp(String(FILE_UPLOAD_LIMITS.maxTotalSizeMb)));
    });

    it('accepts when total exactly equals maxTotalSizeMb (boundary)', () => {
      const oneMb = 1024 * 1024;
      const files = [makeFile('exact.pdf', FILE_UPLOAD_LIMITS.maxTotalSizeMb * oneMb)];
      expect(validateBatch(files, []).valid).toBe(true);
    });

    it('reports count violation before total-size violation when both fail', () => {
      const oneMb = 1024 * 1024;
      const files = Array.from({ length: FILE_UPLOAD_LIMITS.maxFilesPerUpload + 2 }, (_, i) => makeFile(`file-${i}.pdf`, 20 * oneMb));
      const result = validateBatch(files, []);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(new RegExp(String(FILE_UPLOAD_LIMITS.maxFilesPerUpload)));
    });

    it('handles missing alreadyUploaded argument gracefully', () => {
      const files = [makeFile('a.pdf', 1024)];
      expect(validateBatch(files).valid).toBe(true);
    });
  });

  describe('handleFileUpload integration', () => {
    it('does not call uploadFileToRecords when batch is invalid (count > limit)', async () => {
      const { result } = renderHook(() => useFileUpload());
      const files = Array.from({ length: FILE_UPLOAD_LIMITS.maxFilesPerUpload + 1 }, (_, i) => makeFile(`file-${i}.pdf`, 1024));

      await act(async () => {
        await result.current.handleFileUpload(files);
      });

      expect(ecosXhr).not.toHaveBeenCalled();
      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      expect(NotificationManager.error.mock.calls[0][0]).toMatch(new RegExp(String(FILE_UPLOAD_LIMITS.maxFilesPerUpload)));
    });

    it('does not call uploadFileToRecords when total size > maxTotalSizeMb', async () => {
      // Tighten the total-size cap so the batch fails it without crossing
      // either per-file size (10 MB) or count (5) thresholds first.
      const customLimits = { ...FILE_UPLOAD_LIMITS, maxTotalSizeMb: 30 };
      const { result } = renderHook(() => useFileUpload({ limits: customLimits }));
      const oneMb = 1024 * 1024;
      const files = [
        makeFile('big1.pdf', 9 * oneMb),
        makeFile('big2.pdf', 9 * oneMb),
        makeFile('big3.pdf', 9 * oneMb),
        makeFile('big4.pdf', 9 * oneMb),
        makeFile('big5.pdf', 9 * oneMb)
      ];

      await act(async () => {
        await result.current.handleFileUpload(files);
      });

      expect(ecosXhr).not.toHaveBeenCalled();
      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      expect(NotificationManager.error.mock.calls[0][0]).toMatch(/MB/i);
      expect(NotificationManager.error.mock.calls[0][0]).toMatch(/30/);
    });

    it('rejects entire batch when one file is invalid (per-file validation, all-or-nothing)', async () => {
      const { result } = renderHook(() => useFileUpload());
      const files = [makeFile('good.pdf', 1024), makeFile('bad.exe', 1024)];

      await act(async () => {
        await result.current.handleFileUpload(files);
      });

      expect(ecosXhr).not.toHaveBeenCalled();
      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
    });

    it('calls uploadFileToRecords for valid batch', async () => {
      ecosXhr.mockResolvedValue({ entityRef: 'emodel/temp-file@uuid-1' });
      const { result } = renderHook(() => useFileUpload());
      const files = [makeFile('good.pdf', 1024)];

      await act(async () => {
        await result.current.handleFileUpload(files);
      });

      expect(ecosXhr).toHaveBeenCalledTimes(1);
      expect(NotificationManager.error).not.toHaveBeenCalled();
    });

    it('continues uploading remaining files when one upload fails (partial failure)', async () => {
      // First call rejects, second resolves — assert both files were attempted
      // and side-effects fire correctly per documented behaviour.
      ecosXhr
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ entityRef: 'emodel/temp-file@ok' });
      const onUploadStart = jest.fn();
      const onUploadComplete = jest.fn();
      const onUploadError = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useFileUpload({ onUploadStart, onUploadComplete, onUploadError }));
      const files = [makeFile('first.pdf', 1024), makeFile('second.pdf', 1024)];

      await act(async () => {
        await result.current.handleFileUpload(files);
      });

      expect(ecosXhr).toHaveBeenCalledTimes(2);
      expect(onUploadStart).toHaveBeenCalledTimes(1);
      expect(onUploadError).toHaveBeenCalledTimes(1);
      expect(onUploadError.mock.calls[0][1]).toMatchObject({ name: 'first.pdf' });
      expect(onUploadComplete).toHaveBeenCalledTimes(1);
      expect(onUploadComplete.mock.calls[0][0]).toEqual([
        expect.objectContaining({ recordRef: 'emodel/temp-file@ok', name: 'second.pdf' })
      ]);
      expect(result.current.uploadedFiles).toEqual([
        expect.objectContaining({ recordRef: 'emodel/temp-file@ok', name: 'second.pdf' })
      ]);
      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      consoleErrorSpy.mockRestore();
    });

    it('does not flip isUploadingFile or call onUploadStart when per-file validation fails', async () => {
      const onUploadStart = jest.fn();
      const { result } = renderHook(() => useFileUpload({ onUploadStart }));
      const files = [makeFile('bad.exe', 1024)];

      await act(async () => {
        await result.current.handleFileUpload(files);
      });

      expect(onUploadStart).not.toHaveBeenCalled();
      expect(result.current.isUploadingFile).toBe(false);
      expect(result.current.uploadingFiles).toEqual([]);
      expect(ecosXhr).not.toHaveBeenCalled();
    });

    it('rejects an overlapping batch whose new size + in-flight (uploadingFiles) size would exceed maxTotalSizeMb', async () => {
      // Codex finding 1: previously validateBatch only summed `uploadedFiles`,
      // so a second drop fired before the first batch finished could bypass
      // the cumulative cap. We pause the first upload mid-flight and trigger
      // a second batch — it must be rejected without any extra ecosXhr call.
      const oneMb = 1024 * 1024;
      const customLimits = { ...FILE_UPLOAD_LIMITS, maxFileSizeMb: 25, maxTotalSizeMb: 30 };

      let resolveFirst;
      ecosXhr.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirst = resolve;
          })
      );

      const { result } = renderHook(() => useFileUpload({ limits: customLimits }));

      // Start the first batch (20 MB) but don't resolve it yet — it stays
      // in `uploadingFiles` (in-flight, not yet in `uploadedFiles`).
      let firstUpload;
      await act(async () => {
        firstUpload = result.current.handleFileUpload([makeFile('first.pdf', 20 * oneMb)]);
        // yield once so handleFileUpload reaches the await in uploadFileToRecords
        await Promise.resolve();
      });

      expect(ecosXhr).toHaveBeenCalledTimes(1);
      expect(result.current.uploadingFiles).toHaveLength(1);
      expect(result.current.uploadedFiles).toHaveLength(0);
      expect(result.current.isUploadingFile).toBe(true);

      // Second batch (15 MB) overlaps with in-flight first batch.
      // 20 (in-flight) + 15 (new) = 35 MB > 30 MB cap → must be rejected.
      await act(async () => {
        await result.current.handleFileUpload([makeFile('second.pdf', 15 * oneMb)]);
      });

      expect(ecosXhr).toHaveBeenCalledTimes(1); // no new request
      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      expect(NotificationManager.error.mock.calls[0][0]).toMatch(/30/);
      expect(NotificationManager.error.mock.calls[0][0]).toMatch(/MB/i);

      // Now finish the first upload to flush state cleanly.
      await act(async () => {
        resolveFirst({ entityRef: 'emodel/temp-file@first' });
        await firstUpload;
      });

      expect(result.current.uploadingFiles).toHaveLength(0);
      expect(result.current.isUploadingFile).toBe(false);
      expect(result.current.uploadedFiles).toHaveLength(1);
    });

    it('keeps isUploadingFile true while any overlapping batch is still in-flight', async () => {
      // Codex finding 1 (second half): the first batch's `finally` must not
      // flip isUploadingFile back to false while a second batch is still
      // running. With derived state (uploadingFiles.length > 0), the flag
      // stays true until the last upload settles.
      const oneMb = 1024 * 1024;

      let resolveFirst;
      let resolveSecond;
      ecosXhr
        .mockImplementationOnce(
          () =>
            new Promise(resolve => {
              resolveFirst = resolve;
            })
        )
        .mockImplementationOnce(
          () =>
            new Promise(resolve => {
              resolveSecond = resolve;
            })
        );

      const { result } = renderHook(() => useFileUpload());

      let firstUpload;
      let secondUpload;
      await act(async () => {
        firstUpload = result.current.handleFileUpload([makeFile('first.pdf', oneMb)]);
        await Promise.resolve();
      });
      await act(async () => {
        secondUpload = result.current.handleFileUpload([makeFile('second.pdf', oneMb)]);
        await Promise.resolve();
      });

      expect(result.current.uploadingFiles).toHaveLength(2);
      expect(result.current.isUploadingFile).toBe(true);

      // Resolve only the first — the flag must remain true because second
      // is still in-flight.
      await act(async () => {
        resolveFirst({ entityRef: 'emodel/temp-file@first' });
        await firstUpload;
      });
      expect(result.current.isUploadingFile).toBe(true);
      expect(result.current.uploadingFiles).toHaveLength(1);

      await act(async () => {
        resolveSecond({ entityRef: 'emodel/temp-file@second' });
        await secondUpload;
      });
      expect(result.current.isUploadingFile).toBe(false);
      expect(result.current.uploadingFiles).toHaveLength(0);
    });

    it('rejects a second batch when the cumulative size (already uploaded + new) exceeds maxTotalSizeMb', async () => {
      const oneMb = 1024 * 1024;
      ecosXhr.mockResolvedValue({ entityRef: 'emodel/temp-file@first' });
      // Bump per-file limit so 20 MB and 15 MB pass validateFile; tightened
      // total cap (30 MB) is what we want to trip on the second batch.
      const customLimits = { ...FILE_UPLOAD_LIMITS, maxFileSizeMb: 25, maxTotalSizeMb: 30 };
      const { result } = renderHook(() => useFileUpload({ limits: customLimits }));

      // First batch succeeds (20 MB) — populates uploadedFiles state.
      await act(async () => {
        await result.current.handleFileUpload([makeFile('first.pdf', 20 * oneMb)]);
      });
      expect(ecosXhr).toHaveBeenCalledTimes(1);
      expect(result.current.uploadedFiles).toHaveLength(1);

      // Second batch (15 MB new) would push total to 35 MB > 30 MB cap.
      await act(async () => {
        await result.current.handleFileUpload([makeFile('second.pdf', 15 * oneMb)]);
      });

      expect(ecosXhr).toHaveBeenCalledTimes(1); // unchanged
      expect(NotificationManager.error).toHaveBeenCalledTimes(1);
      expect(NotificationManager.error.mock.calls[0][0]).toMatch(/30/);
      expect(NotificationManager.error.mock.calls[0][0]).toMatch(/MB/i);
    });
  });

  describe('handleDragOver (drop-zone highlight)', () => {
    const makeDragEvent = items => ({
      preventDefault: jest.fn(),
      dataTransfer: { items }
    });

    it('sets dragOver=true when at least one file with valid MIME is dragged', () => {
      const { result } = renderHook(() => useFileUpload());
      const event = makeDragEvent([{ kind: 'file', type: 'image/png' }]);

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.dragOver).toBe(true);
    });

    it('keeps dragOver=false when only blocked-MIME files are dragged', () => {
      const { result } = renderHook(() => useFileUpload());
      const event = makeDragEvent([
        { kind: 'file', type: 'application/x-msdownload' },
        { kind: 'file', type: 'image/svg+xml' }
      ]);

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.dragOver).toBe(false);
    });

    it('keeps dragOver=false when only non-file items are dragged (e.g. text)', () => {
      const { result } = renderHook(() => useFileUpload());
      const event = makeDragEvent([{ kind: 'string', type: 'text/plain' }]);

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(result.current.dragOver).toBe(false);
    });

    it('keeps dragOver=false when items list is empty', () => {
      const { result } = renderHook(() => useFileUpload());
      const event = makeDragEvent([]);

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(result.current.dragOver).toBe(false);
    });

    it('sets dragOver=true on mixed batch (one valid file)', () => {
      const { result } = renderHook(() => useFileUpload());
      const event = makeDragEvent([
        { kind: 'file', type: 'application/x-msdownload' },
        { kind: 'file', type: 'application/pdf' }
      ]);

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(result.current.dragOver).toBe(true);
    });

    it('treats empty MIME as permissive (browser-reported octet-stream / unknown) and sets dragOver=true', () => {
      const { result } = renderHook(() => useFileUpload());
      const event = makeDragEvent([{ kind: 'file', type: '' }]);

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(result.current.dragOver).toBe(true);
    });

    it('always calls preventDefault even when not highlighting (so drop zone receives drop)', () => {
      const { result } = renderHook(() => useFileUpload());
      const event = makeDragEvent([{ kind: 'file', type: 'audio/mpeg' }]);

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('handleDragLeave', () => {
    it('clears dragOver when leaving the drop zone (relatedTarget outside)', () => {
      const { result } = renderHook(() => useFileUpload());

      // First, set dragOver=true via handleDragOver
      act(() => {
        result.current.handleDragOver({
          preventDefault: jest.fn(),
          dataTransfer: { items: [{ kind: 'file', type: 'image/png' }] }
        });
      });
      expect(result.current.dragOver).toBe(true);

      // Now leave: relatedTarget not contained by currentTarget
      const currentTarget = { contains: jest.fn().mockReturnValue(false) };
      act(() => {
        result.current.handleDragLeave({
          preventDefault: jest.fn(),
          currentTarget,
          relatedTarget: {}
        });
      });
      expect(result.current.dragOver).toBe(false);
    });

    it('keeps dragOver=true when leaving into a child element (relatedTarget contained)', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.handleDragOver({
          preventDefault: jest.fn(),
          dataTransfer: { items: [{ kind: 'file', type: 'image/png' }] }
        });
      });
      expect(result.current.dragOver).toBe(true);

      const currentTarget = { contains: jest.fn().mockReturnValue(true) };
      act(() => {
        result.current.handleDragLeave({
          preventDefault: jest.fn(),
          currentTarget,
          relatedTarget: {}
        });
      });
      expect(result.current.dragOver).toBe(true);
    });
  });

  describe('removeUploadedFile / clearUploadedFiles', () => {
    it('removes only the matching uploaded file by recordRef', async () => {
      ecosXhr
        .mockResolvedValueOnce({ entityRef: 'emodel/temp-file@a' })
        .mockResolvedValueOnce({ entityRef: 'emodel/temp-file@b' });
      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.handleFileUpload([makeFile('a.pdf', 100), makeFile('b.pdf', 100)]);
      });
      expect(result.current.uploadedFiles).toHaveLength(2);

      act(() => {
        result.current.removeUploadedFile({ recordRef: 'emodel/temp-file@a' });
      });

      expect(result.current.uploadedFiles).toEqual([
        expect.objectContaining({ recordRef: 'emodel/temp-file@b', name: 'b.pdf' })
      ]);
    });

    it('clearUploadedFiles empties the uploaded list', async () => {
      ecosXhr.mockResolvedValue({ entityRef: 'emodel/temp-file@x' });
      const { result } = renderHook(() => useFileUpload());

      await act(async () => {
        await result.current.handleFileUpload([makeFile('x.pdf', 100)]);
      });
      expect(result.current.uploadedFiles).toHaveLength(1);

      act(() => {
        result.current.clearUploadedFiles();
      });
      expect(result.current.uploadedFiles).toEqual([]);
    });
  });

  describe('handleFileUploadClick', () => {
    it('clicks the underlying file input element via fileInputRef', () => {
      const { result } = renderHook(() => useFileUpload());
      const click = jest.fn();
      result.current.fileInputRef.current = { click };

      act(() => {
        result.current.handleFileUploadClick();
      });

      expect(click).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when fileInputRef.current is null', () => {
      const { result } = renderHook(() => useFileUpload());
      result.current.fileInputRef.current = null;

      expect(() => {
        act(() => {
          result.current.handleFileUploadClick();
        });
      }).not.toThrow();
    });
  });
});
