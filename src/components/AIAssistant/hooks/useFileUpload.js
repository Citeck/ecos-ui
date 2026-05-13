import { useState, useRef, useCallback } from 'react';

import {
  FILE_UPLOAD_WHITELIST,
  FILE_UPLOAD_BLOCKLIST,
  FILE_UPLOAD_LIMITS,
  getFileExtension,
  isExtensionAllowed,
  isExtensionBlocked,
  hasValidDraggedFile
} from '../constants';

import ecosXhr from '@/helpers/ecosXhr';
import { NotificationManager } from '@/services/notifications';

/**
 * Hook for handling file uploads with drag & drop support.
 *
 * Per-file validation pipeline (`validateFile`) — order matters; the first
 * failing rule decides the user-facing message:
 *   1. blocklist (`.exe`, `.svg`, archives, media…) — explicit "not supported"
 *   2. whitelist — "unsupported type"
 *   3. size > `limits.maxFileSizeMb`
 *   4. size === 0 — empty file or directory dropped
 *   5. filename.length > `limits.maxFileNameLength`
 *
 * Cross-file (batch) validation pipeline (`validateBatch`):
 *   1. files.length > `limits.maxFilesPerUpload`
 *   2. sum(new sizes) + sum(already-uploaded sizes) > `limits.maxTotalSizeMb`
 *
 * Drag-over highlight uses MIME-only pre-filtering via `hasValidDraggedFile`
 * because the browser intentionally hides filenames/extensions until `drop`.
 * The authoritative reject still happens after `drop` through `validateFile`.
 *
 * @param {Object} [options] - Configuration options
 * @param {Object<string, string[]>} [options.whitelistGroups=FILE_UPLOAD_WHITELIST] - Allowed extension groups, keyed by category
 * @param {Object<string, string[]>} [options.blocklistGroups=FILE_UPLOAD_BLOCKLIST] - Blocked extension groups, keyed by category (UX guard, not security boundary)
 * @param {Object} [options.limits=FILE_UPLOAD_LIMITS] - Size/count/name limits
 * @param {number} [options.limits.maxFileSizeMb] - Per-file size limit in MB
 * @param {number} [options.limits.maxFilesPerUpload] - Max files per upload action
 * @param {number} [options.limits.maxTotalSizeMb] - Cumulative size limit per conversation, MB
 * @param {number} [options.limits.maxFileNameLength] - Max characters in filename
 * @param {Function} [options.onUploadStart] - Called once before the network layer when batch validation passes
 * @param {Function} [options.onUploadComplete] - Called with the array of successfully uploaded refs after all attempts settle
 * @param {Function} [options.onUploadError] - Called with `(error, fileData)` for each failed file (per-file, not batch)
 * @returns {Object} hook API
 * @returns {Array<{recordRef:string,name:string,size:number,type:string}>} return.uploadedFiles - Successfully uploaded files
 * @returns {Array<{id:string,name:string,size:number,type:string,isUploading:boolean,file:File}>} return.uploadingFiles - Files currently in flight
 * @returns {boolean} return.isUploadingFile - Derived `uploadingFiles.length > 0`; true while any upload is in progress (including across overlapping batches)
 * @returns {boolean} return.dragOver - True when a valid file is being dragged over the drop zone
 * @returns {React.MutableRefObject} return.fileInputRef - Ref to attach to a hidden `<input type="file">`
 * @returns {Function} return.handleFileUpload - `(files) => Promise<void>` — runs batch + per-file validation, then uploads
 * @returns {Function} return.handleFileUploadClick - Opens the file picker by clicking `fileInputRef.current`
 * @returns {Function} return.handleDragOver - DragEvent handler that toggles `dragOver` based on MIME pre-filter
 * @returns {Function} return.handleDragLeave - DragEvent handler that resets `dragOver`
 * @returns {Function} return.removeUploadedFile - Removes a previously uploaded file from `uploadedFiles` by `recordRef`
 * @returns {Function} return.clearUploadedFiles - Clears `uploadedFiles`
 * @returns {Function} return.validateFile - `(file) => {valid, error?}` — exported for tests/UI hints
 * @returns {Function} return.validateBatch - `(files, alreadyUploaded?) => {valid, error?}` — exported for tests/UI hints
 */
const useFileUpload = (options = {}) => {
  const {
    whitelistGroups = FILE_UPLOAD_WHITELIST,
    blocklistGroups = FILE_UPLOAD_BLOCKLIST,
    limits = FILE_UPLOAD_LIMITS,
    onUploadStart,
    onUploadComplete,
    onUploadError
  } = options;

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  // `isUploadingFile` is derived from `uploadingFiles` so overlapping batches
  // can't cause an early flip-to-false: the flag stays true as long as any
  // upload (across batches) is still in flight.
  const isUploadingFile = uploadingFiles.length > 0;
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  // Mirror of `uploadingFiles` for synchronous reads from inside an upload
  // batch: we need the in-flight bytes when validating the next overlapping
  // batch, but state updates aren't observable until after a render.
  const uploadingFilesRef = useRef([]);
  const updateUploadingFiles = useCallback(updater => {
    setUploadingFiles(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      uploadingFilesRef.current = next;
      return next;
    });
  }, []);
  // Monotonic counter so two overlapping batches never produce colliding ids
  // (Date.now() resolution is 1 ms — two drops in the same tick would clash).
  const uploadingFileIdRef = useRef(0);

  /**
   * Upload a single file to the Records API as a `temp-file` entity.
   * Throws if the response does not contain `entityRef`.
   * @param {File} file
   * @returns {Promise<{recordRef:string,name:string,size:number,type:string}>}
   */
  const uploadFileToRecords = useCallback(async file => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    const response = await ecosXhr('/gateway/emodel/api/ecos/webapp/content', {
      method: 'POST',
      body: formData
    });

    const { entityRef = null } = response;
    if (!entityRef) {
      throw new Error('No file entityRef received');
    }

    return {
      recordRef: entityRef,
      name: file.name,
      size: file.size,
      type: file.type
    };
  }, []);

  /**
   * Validate a single file's extension, size, and name length.
   * See the per-file pipeline order in the hook JSDoc above.
   * @param {File} file
   * @returns {{valid: boolean, error?: string}}
   */
  const validateFile = useCallback(
    file => {
      const ext = getFileExtension(file.name);
      const maxFileSizeMb = limits.maxFileSizeMb;
      const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

      if (isExtensionBlocked(file.name, blocklistGroups)) {
        return {
          valid: false,
          error: `Файлы типа ${ext} не поддерживаются`
        };
      }

      if (!isExtensionAllowed(file.name, whitelistGroups)) {
        return {
          valid: false,
          error: ext ? `Неподдерживаемый тип файла: ${ext}` : 'Неподдерживаемый тип файла: расширение отсутствует'
        };
      }

      if (file.size > maxFileSizeBytes) {
        const fileSizeMb = (file.size / 1024 / 1024).toFixed(1);
        return {
          valid: false,
          error: `Файл «${file.name}» слишком большой (${fileSizeMb} MB, лимит ${maxFileSizeMb} MB)`
        };
      }

      if (file.size === 0) {
        return {
          valid: false,
          error: 'Файл пуст или это папка'
        };
      }

      if (file.name.length > limits.maxFileNameLength) {
        return {
          valid: false,
          error: `Имя файла слишком длинное (макс. ${limits.maxFileNameLength} символов)`
        };
      }

      return { valid: true };
    },
    [whitelistGroups, blocklistGroups, limits]
  );

  /**
   * Cross-file (batch) validation: file count and cumulative size including
   * files already uploaded in the same conversation. Count is checked before
   * total-size because the count violation is more concrete to the user.
   * @param {FileList|File[]} files - New files about to be uploaded
   * @param {Array<{size:number}>} [alreadyUploaded=[]] - Previously uploaded files contributing to the conversation size
   * @returns {{valid: boolean, error?: string}}
   */
  const validateBatch = useCallback(
    (files, alreadyUploaded = []) => {
      const fileArray = Array.from(files || []);

      if (fileArray.length > limits.maxFilesPerUpload) {
        return {
          valid: false,
          error: `Можно загрузить не более ${limits.maxFilesPerUpload} файлов за раз`
        };
      }

      const newSize = fileArray.reduce((acc, f) => acc + (f && f.size ? f.size : 0), 0);
      const existingSize = (alreadyUploaded || []).reduce((acc, f) => acc + (f && f.size ? f.size : 0), 0);
      const totalBytes = newSize + existingSize;
      const maxTotalBytes = limits.maxTotalSizeMb * 1024 * 1024;

      if (totalBytes > maxTotalBytes) {
        return {
          valid: false,
          error: `Превышен лимит ${limits.maxTotalSizeMb} MB на разговор`
        };
      }

      return { valid: true };
    },
    [limits]
  );

  /**
   * Validate and upload a batch of files. Order:
   *   1. `validateBatch` — count + cumulative size against
   *      `uploadedFiles ∪ in-flight uploadingFiles` (no state mutation on fail)
   *   2. `validateFile` — per-file checks (no state mutation on fail; entire
   *      batch is rejected on the first failure)
   *   3. State mutation (`uploadingFiles`) and `onUploadStart`. `isUploadingFile`
   *      is derived from `uploadingFiles.length > 0` and stays true across
   *      overlapping batches.
   *   4. Sequential upload via `uploadFileToRecords`; per-file errors notify
   *      and call `onUploadError` but do not abort remaining uploads.
   * @param {FileList|File[]} files
   * @returns {Promise<void>}
   */
  const handleFileUpload = useCallback(
    async files => {
      if (!files || files.length === 0) return;

      // Cross-file batch validation runs before any state mutation so that
      // an invalid batch leaves uploadingFiles untouched and never reaches
      // the network layer. We include in-flight uploads (uploadingFilesRef)
      // alongside completed ones so a quick second drop can't bypass the
      // cumulative cap by starting before the first batch finishes.
      const batchValidation = validateBatch(files, [...uploadedFiles, ...uploadingFilesRef.current]);
      if (!batchValidation.valid) {
        NotificationManager.error(batchValidation.error, 'Загрузка файлов');
        return;
      }

      const filesToUpload = Array.from(files).map(file => ({
        id: `uploading-${++uploadingFileIdRef.current}`,
        name: file.name,
        size: file.size,
        type: file.type,
        isUploading: true,
        file: file
      }));

      // Per-file validation also runs before state mutation; a single failure
      // rejects the whole batch without calling onUploadStart.
      for (const fileData of filesToUpload) {
        const validation = validateFile(fileData.file);
        if (!validation.valid) {
          NotificationManager.error(validation.error, 'Загрузка файлов');
          return;
        }
      }

      onUploadStart?.();
      updateUploadingFiles(prev => [...prev, ...filesToUpload]);

      const uploadedResults = [];

      try {
        for (const fileData of filesToUpload) {
          try {
            const uploadedFileRef = await uploadFileToRecords(fileData.file);
            updateUploadingFiles(prev => prev.filter(f => f.id !== fileData.id));
            setUploadedFiles(prev => [...prev, uploadedFileRef]);
            uploadedResults.push(uploadedFileRef);
          } catch (error) {
            updateUploadingFiles(prev => prev.filter(f => f.id !== fileData.id));
            console.error('Error uploading file:', fileData.name, error);
            NotificationManager.error(`Ошибка загрузки файла "${fileData.name}": ${error.message}`, 'Загрузка файлов');
            onUploadError?.(error, fileData);
          }
        }
      } finally {
        if (uploadedResults.length > 0) {
          onUploadComplete?.(uploadedResults);
        }
      }
    },
    [validateFile, validateBatch, uploadedFiles, uploadFileToRecords, updateUploadingFiles, onUploadStart, onUploadComplete, onUploadError]
  );

  // Handle file input click
  const handleFileUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  /**
   * Drag-over handler. Toggles `dragOver` based on a MIME pre-filter so the
   * drop-zone highlight only appears for plausibly-valid drags.
   *
   * `dataTransfer.items` only exposes `kind` and `type` (MIME) during dragover —
   * filenames/extensions are intentionally hidden by the browser until `drop`.
   * Hence MIME-only here; extension-based validation triggered on `drop`
   * (via `validateBatch` + `validateFile`) remains the authoritative check.
   */
  const handleDragOver = useCallback(
    e => {
      e.preventDefault();
      const items = e.dataTransfer && e.dataTransfer.items;
      const valid = hasValidDraggedFile(items);
      if (valid) {
        if (!dragOver) setDragOver(true);
      } else if (dragOver) {
        setDragOver(false);
      }
    },
    [dragOver]
  );

  // Handle drag leave
  const handleDragLeave = useCallback(e => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  }, []);

  // Remove uploaded file
  const removeUploadedFile = useCallback(fileToRemove => {
    setUploadedFiles(prev => prev.filter(f => f.recordRef !== fileToRemove.recordRef));
  }, []);

  // Clear all uploaded files
  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  return {
    // State
    uploadedFiles,
    uploadingFiles,
    isUploadingFile,
    dragOver,
    fileInputRef,

    // Actions
    handleFileUpload,
    handleFileUploadClick,
    handleDragOver,
    handleDragLeave,
    removeUploadedFile,
    clearUploadedFiles,

    // Utilities
    validateFile,
    validateBatch
  };
};

export default useFileUpload;
