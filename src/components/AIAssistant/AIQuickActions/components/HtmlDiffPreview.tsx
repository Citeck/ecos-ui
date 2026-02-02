/**
 * HtmlDiffPreview Component
 * Compact HTML diff preview for inline AI results
 * Shows rendered HTML with diff highlighting for text changes
 */

import React, { useState, useMemo, useEffect } from 'react';
import classNames from 'classnames';
// @ts-ignore - diff doesn't have types bundled
import { diffWords } from 'diff';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-github';

/**
 * Format HTML using prettier
 */
const formatHtml = async (html: string): Promise<string> => {
  if (!html || !html.trim()) return html;

  try {
    const { format } = await import('prettier/standalone');
    const htmlParser = await import('prettier/parser-html');

    return await format(html, {
      parser: 'html',
      plugins: [htmlParser.default || htmlParser],
      printWidth: 80,
      tabWidth: 2,
      htmlWhitespaceSensitivity: 'ignore'
    });
  } catch (error) {
    console.warn('Failed to format HTML:', error);
    return html;
  }
};

interface Change {
  value: string;
  added?: boolean;
  removed?: boolean;
}
import DOMPurify from 'dompurify';
import { t } from '@/helpers/export/util';

type ViewMode = 'preview' | 'diff' | 'source';

/**
 * Strip HTML tags and get plain text
 */
const stripHtml = (html: string): string => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

export interface HtmlDiffPreviewProps {
  original?: string;
  generated?: string;
}

const HtmlDiffPreview: React.FC<HtmlDiffPreviewProps> = ({
  original = '',
  generated = ''
}) => {
  // Determine initial view mode based on content type
  const getInitialViewMode = (): ViewMode => {
    const isNew = !original || stripHtml(original).trim() === '';
    const hasTextDiff = stripHtml(original) !== stripHtml(generated);
    // Show diff tab by default when there are text changes, otherwise show preview
    return !isNew && hasTextDiff ? 'diff' : 'preview';
  };

  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [formattedHtml, setFormattedHtml] = useState<string>(generated);

  // Format HTML when generated content changes or when switching to source view
  useEffect(() => {
    if (viewMode === 'source' && generated) {
      formatHtml(generated).then(setFormattedHtml);
    }
  }, [generated, viewMode]);

  // Sanitize HTML for safe rendering
  // Note: 'style' attribute is intentionally excluded to prevent CSS-based attacks
  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(generated, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      // Only allow safe URI schemes to prevent XSS (javascript:, data:, etc. are blocked)
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):)/i
    });
  }, [generated]);

  // Calculate text diff (without HTML tags)
  const textDiff = useMemo((): Change[] => {
    const originalText = stripHtml(original);
    const generatedText = stripHtml(generated);

    if (!originalText) {
      return [{ value: generatedText, added: true, removed: false }];
    }

    return diffWords(originalText, generatedText);
  }, [original, generated]);

  // Determine if this is new content or modification
  const isNewContent = !original || stripHtml(original).trim() === '';
  // Check both text content AND HTML structure changes (for formatting-only edits like bold/italic)
  const hasTextChanges = stripHtml(original) !== stripHtml(generated);
  const hasHtmlChanges = original !== generated;
  const hasChanges = hasTextChanges || hasHtmlChanges;

  // No changes
  if (!hasChanges && !isNewContent) {
    return (
      <div className="ai-html-diff-preview ai-html-diff-preview--unchanged">
        <div className="ai-html-diff-preview__message">
          {t('ai-html-diff.no-changes', 'No changes')}
        </div>
      </div>
    );
  }

  return (
    <div className={classNames('ai-html-diff-preview', {
      'ai-html-diff-preview--new': isNewContent
    })}>
      {/* View mode tabs - Changes first (when available), then Preview, then Source */}
      <div className="ai-html-diff-preview__tabs">
        {/* Show Changes tab only when there are actual text changes (not just formatting) */}
        {!isNewContent && hasTextChanges && (
          <button
            type="button"
            className={classNames('ai-html-diff-preview__tab', {
              'ai-html-diff-preview__tab--active': viewMode === 'diff'
            })}
            onClick={() => setViewMode('diff')}
          >
            {t('ai-html-diff.diff', 'Changes')}
          </button>
        )}
        <button
          type="button"
          className={classNames('ai-html-diff-preview__tab', {
            'ai-html-diff-preview__tab--active': viewMode === 'preview'
          })}
          onClick={() => setViewMode('preview')}
        >
          {t('ai-html-diff.preview', 'Preview')}
        </button>
        <button
          type="button"
          className={classNames('ai-html-diff-preview__tab', {
            'ai-html-diff-preview__tab--active': viewMode === 'source'
          })}
          onClick={() => setViewMode('source')}
        >
          {t('ai-html-diff.source', 'Source')}
        </button>
        {isNewContent && (
          <span className="ai-html-diff-preview__badge ai-html-diff-preview__badge--new">
            {t('ai-html-diff.new', 'New')}
          </span>
        )}
      </div>

      {/* Content based on view mode */}
      <div className="ai-html-diff-preview__content">
        {viewMode === 'preview' && (
          <div
            className="ai-html-diff-preview__rendered"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        )}

        {viewMode === 'diff' && (
          <div className="ai-html-diff-preview__text-diff">
            {textDiff.map((part, index) => {
              if (part.removed) {
                return (
                  <span key={index} className="ai-diff-removed">
                    {part.value}
                  </span>
                );
              }
              return (
                <span
                  key={index}
                  className={classNames({
                    'ai-diff-added': part.added,
                    'ai-diff-unchanged': !part.added && !part.removed
                  })}
                >
                  {part.value}
                </span>
              );
            })}
          </div>
        )}

        {viewMode === 'source' && (
          <AceEditor
            mode="html"
            theme="github"
            value={formattedHtml}
            readOnly={true}
            width="100%"
            maxLines={Infinity}
            fontSize={12}
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={false}
            setOptions={{
              useWorker: false,
              showLineNumbers: true,
              tabSize: 2
            }}
            editorProps={{ $blockScrolling: true }}
          />
        )}
      </div>
    </div>
  );
};

export default HtmlDiffPreview;
