import React, { useMemo } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import { Icon } from "../common";

// Функция для извлечения чистого текста из HTML
const htmlToPlainText = (html) => {
  if (!html || typeof html !== 'string') {
    return html || '';
  }

  // Создаем временный элемент для извлечения текста
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Заменяем некоторые HTML теги на переносы строк для лучшего форматирования
  const textWithBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n');

  tempDiv.innerHTML = textWithBreaks;

  // Извлекаем текст и убираем лишние пробелы и переносы
  return tempDiv.textContent || tempDiv.innerText || '';
};

const DiffViewer = ({
  original,
  modified,
  originalLabel = "Исходный текст",
  modifiedLabel = "Отредактированный текст",
  onApplyChanges,
  isApplying = false,
  className = ""
}) => {
  // Извлекаем чистый текст из HTML для сравнения
  const cleanOriginal = useMemo(() => htmlToPlainText(original), [original]);
  const cleanModified = useMemo(() => htmlToPlainText(modified), [modified]);

  if (!original || !modified) {
    return null;
  }

  // Современные стили для react-diff-viewer
  const customStyles = {
    variables: {
      light: {
        codeFoldGutterBackground: '#f8fafc',
        codeFoldBackground: '#ffffff',
        gutterBackground: '#f8fafc',
        gutterBackgroundDark: '#e2e8f0',
        highlightBackground: '#fef3c7',
        highlightGutterBackground: '#fed7aa',
        lineBackground: '#ffffff',
        lineBackgroundLight: '#f8fafc',
        wordAddedBackground: '#dcfce7',
        wordRemovedBackground: '#fecaca',
        addedBackground: '#f0fdf4',
        removedBackground: '#fef2f2',
        emptyLineBackground: '#f8fafc',
        gutterColor: '#64748b',
        addedColor: '#166534',
        removedColor: '#991b1b',
        wordAddedColor: '#166534',
        wordRemovedColor: '#991b1b',
        diffViewerColor: '#1e293b',
        addedGutterColor: '#059669',
        removedGutterColor: '#dc2626',
        gutterBackgroundLight: '#f8fafc'
      }
    }
  };

  return (
    <div className="ai-assistant-diff-viewer">
      <div className="ai-assistant-diff-viewer__header">
        <div className="ai-assistant-diff-viewer__labels">
          <span className="ai-assistant-diff-viewer__label ai-assistant-diff-viewer__label--original">
            <Icon className="fa fa-file-text-o" />
            {originalLabel}
          </span>
          <span className="ai-assistant-diff-viewer__label ai-assistant-diff-viewer__label--modified">
            <Icon className="fa fa-file-text" />
            {modifiedLabel}
          </span>
        </div>
        {onApplyChanges && (
          <button
            className="ai-assistant-diff-viewer__apply-btn"
            onClick={onApplyChanges}
            disabled={isApplying}
            title="Применить изменения"
          >
            {isApplying ? (
              <>
                <Icon className="fa fa-spinner fa-spin" />
                Применение...
              </>
            ) : (
              <>
                <Icon className="fa fa-check" />
                Применить изменения
              </>
            )}
          </button>
        )}
      </div>

      <div className="ai-assistant-diff-viewer__content">
        <ReactDiffViewer
          oldValue={cleanOriginal}
          newValue={cleanModified}
          splitView={true}
          showDiffOnly={false}
          hideLineNumbers={false}
          useDarkTheme={false}
          leftTitle=""
          rightTitle=""
          styles={customStyles}
        />
      </div>
    </div>
  );
};

export default DiffViewer;
