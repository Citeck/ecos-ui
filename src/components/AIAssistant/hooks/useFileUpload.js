import { useState, useRef, useCallback } from 'react';
import ecosXhr from '@/helpers/ecosXhr';
import { NotificationManager } from '@/services/notifications';

const DEFAULT_ALLOWED_TYPES = ['.pdf', '.doc', '.docx', '.txt'];
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Hook for handling file uploads with drag & drop support
 * @param {Object} options - Configuration options
 * @param {string[]} options.allowedTypes - Allowed file extensions (default: ['.pdf', '.doc', '.docx', '.txt'])
 * @param {number} options.maxSizeBytes - Maximum file size in bytes (default: 10MB)
 * @param {Function} options.onUploadStart - Callback when upload starts
 * @param {Function} options.onUploadComplete - Callback when all uploads complete
 * @param {Function} options.onUploadError - Callback when upload fails
 * @returns {Object} File upload state and handlers
 */
const useFileUpload = (options = {}) => {
  const {
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
    onUploadStart,
    onUploadComplete,
    onUploadError
  } = options;

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Upload file to Records API
  const uploadFileToRecords = useCallback(async (file) => {
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

  // Validate file type and size
  const validateFile = useCallback((file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `Неподдерживаемый тип файла: ${fileExtension}. Разрешены: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(0);
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      return {
        valid: false,
        error: `Файл слишком большой: ${fileSizeMB}MB. Максимум: ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }, [allowedTypes, maxSizeBytes]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    onUploadStart?.();

    const filesToUpload = Array.from(files).map((file, index) => ({
      id: `uploading-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      isUploading: true,
      file: file
    }));

    // Validate all files first
    for (const fileData of filesToUpload) {
      const validation = validateFile(fileData.file);
      if (!validation.valid) {
        NotificationManager.error(validation.error, 'Загрузка файлов');
        setIsUploadingFile(false);
        return;
      }
    }

    setUploadingFiles(prev => [...prev, ...filesToUpload]);

    const uploadedResults = [];

    try {
      for (const fileData of filesToUpload) {
        try {
          const uploadedFileRef = await uploadFileToRecords(fileData.file);
          setUploadingFiles(prev => prev.filter(f => f.id !== fileData.id));
          setUploadedFiles(prev => [...prev, uploadedFileRef]);
          uploadedResults.push(uploadedFileRef);
        } catch (error) {
          setUploadingFiles(prev => prev.filter(f => f.id !== fileData.id));
          console.error('Error uploading file:', fileData.name, error);
          NotificationManager.error(
            `Ошибка загрузки файла "${fileData.name}": ${error.message}`,
            'Загрузка файлов'
          );
          onUploadError?.(error, fileData);
        }
      }
    } finally {
      setIsUploadingFile(false);
      if (uploadedResults.length > 0) {
        onUploadComplete?.(uploadedResults);
      }
    }
  }, [validateFile, uploadFileToRecords, onUploadStart, onUploadComplete, onUploadError]);

  // Handle file input click
  const handleFileUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Handle file drop
  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!dragOver) {
      setDragOver(true);
    }
  }, [dragOver]);

  // Handle drag leave
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  }, []);

  // Remove uploaded file
  const removeUploadedFile = useCallback((fileToRemove) => {
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
    handleFileDrop,
    handleDragOver,
    handleDragLeave,
    removeUploadedFile,
    clearUploadedFiles,

    // Utilities
    validateFile
  };
};

export default useFileUpload;
