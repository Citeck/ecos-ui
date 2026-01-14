/**
 * AIInlineResult Component
 * Displays AI-generated result with apply/cancel/retry options
 * Supports different content types: text, code, html
 */

import React, { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense, ChangeEvent, KeyboardEvent } from 'react';
import classNames from 'classnames';
// @ts-ignore - diff doesn't have types bundled
import { diffWords } from 'diff';

interface Change {
  value: string;
  added?: boolean;
  removed?: boolean;
}
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { t } from '@/helpers/export/util';
import { Icon } from '@/components/common';
import { CONTENT_TYPES, getScriptContextLabel } from '@/components/AIAssistant/constants';
import { ContentType } from '../config/fieldActionConfigs';

// Icon components for action buttons
const CloseIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const RefreshIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Lazy load heavy diff components
const CodeDiffPreview = lazy(() => import('./CodeDiffPreview'));
const HtmlDiffPreview = lazy(() => import('./HtmlDiffPreview'));

/**
 * Sparkle Icon
 */
const SparkleIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 50 50" fill="currentColor">
    <path d="M49.04,24.001l-1.082-0.043h-0.001C36.134,23.492,26.508,13.866,26.042,2.043L25.999,0.96C25.978,0.424,25.537,0,25,0s-0.978,0.424-0.999,0.96l-0.043,1.083C23.492,13.866,13.866,23.492,2.042,23.958L0.96,24.001C0.424,24.022,0,24.463,0,25c0,0.537,0.424,0.978,0.961,0.999l1.082,0.042c11.823,0.467,21.449,10.093,21.915,21.916l0.043,1.083C24.022,49.576,24.463,50,25,50s0.978-0.424,0.999-0.96l0.043-1.083c0.466-11.823,10.092-21.449,21.915-21.916l1.082-0.042C49.576,25.978,50,25.537,50,25C50,24.463,49.576,24.022,49.04,24.001z" />
  </svg>
);

export interface AIInlineResultProps {
  isVisible?: boolean;
  originalValue?: string;
  generatedValue?: string;
  explanation?: string;
  isLoading?: boolean;
  isApplying?: boolean;
  onApply: () => void;
  onCancel: () => void;
  onCancelGeneration?: () => void;
  onRetry?: (newPrompt: string) => void;
  onAnotherVariant?: () => void;
  showDiff?: boolean;
  contentType?: ContentType;
  language?: string;
  contextType?: string;
  className?: string;
}

const AIInlineResult: React.FC<AIInlineResultProps> = ({
  isVisible = false,
  originalValue = '',
  generatedValue = '',
  explanation = '',
  isLoading = false,
  isApplying = false,
  onApply,
  onCancel,
  onCancelGeneration,
  onRetry,
  onAnotherVariant,
  showDiff = false,
  contentType = CONTENT_TYPES.TEXT,
  language = 'javascript',
  contextType = '',
  className
}) => {
  const [retryPrompt, setRetryPrompt] = useState('');
  const [showRetryInput, setShowRetryInput] = useState(false);
  const retryInputRef = useRef<HTMLInputElement>(null);

  // Focus retry input when shown
  useEffect(() => {
    if (showRetryInput && retryInputRef.current) {
      retryInputRef.current.focus();
    }
  }, [showRetryInput]);

  // Reset state when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setRetryPrompt('');
      setShowRetryInput(false);
    }
  }, [isVisible]);

  // Global ESC/Enter key handler (capture phase for priority)
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Don't intercept Enter if focus is in retry input
      const isInRetryInput = (e.target as HTMLElement)?.classList?.contains('ai-inline-result__retry-input');

      if (e.key === 'Escape' && !isApplying) {
        e.preventDefault();
        // During loading, cancel the generation; otherwise just close
        if (isLoading && onCancelGeneration) {
          onCancelGeneration();
        } else if (!isLoading) {
          onCancel?.();
        }
      } else if (e.key === 'Enter' && !e.shiftKey && !isApplying && !isLoading && !isInRetryInput) {
        e.preventDefault();
        onApply?.();
      }
    };

    // Use capture phase to handle ESC/Enter before other handlers, without blocking them
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isVisible, isApplying, isLoading, onCancel, onCancelGeneration, onApply]);

  const handleApply = useCallback(() => {
    if (!isApplying) {
      onApply?.();
    }
  }, [isApplying, onApply]);

  const handleCancel = useCallback(() => {
    if (isApplying) return;

    // During loading, cancel the generation; otherwise just close
    if (isLoading && onCancelGeneration) {
      onCancelGeneration();
    } else if (!isLoading) {
      onCancel?.();
    }
  }, [isApplying, isLoading, onCancel, onCancelGeneration]);

  const handleAnotherVariant = useCallback(() => {
    if (!isLoading) {
      onAnotherVariant?.();
    }
  }, [isLoading, onAnotherVariant]);

  const handleRetrySubmit = useCallback(() => {
    const trimmedPrompt = retryPrompt.trim();
    if (trimmedPrompt && !isLoading) {
      onRetry?.(trimmedPrompt);
      setRetryPrompt('');
      setShowRetryInput(false);
    }
  }, [retryPrompt, isLoading, onRetry]);

  const handleRetryKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRetrySubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowRetryInput(false);
      setRetryPrompt('');
    }
  }, [handleRetrySubmit]);

  const toggleRetryInput = useCallback(() => {
    setShowRetryInput(prev => !prev);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={classNames(
        'ai-inline-result',
        {
          'ai-inline-result--loading': isLoading,
          'ai-inline-result--with-diff': showDiff,
          'ai-inline-result--code': contentType === CONTENT_TYPES.CODE,
          'ai-inline-result--html': contentType === CONTENT_TYPES.HTML
        },
        className
      )}
    >
      {/* Header */}
      <div className="ai-inline-result__header">
        <span className="ai-inline-result__badge">
          <SparkleIcon />
          AI
        </span>
        {contextType && (
          <span className="ai-inline-result__context-type">
            {getScriptContextLabel(contextType)}
          </span>
        )}
        {!isLoading && (
          <span className="ai-inline-result__label">
            {t('ai-actions.result.generated', 'Generated result')}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="ai-inline-result__content">
        {isLoading ? (
          <div className="ai-inline-result__loading">
            <div className="ai-inline-result__loading-indicator">
              <div className="ai-loading-wave">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Explanation (if provided) - shown above diff */}
            {explanation && (
              <div className="ai-inline-result__explanation">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    )
                  }}
                >
                  {explanation}
                </Markdown>
              </div>
            )}

            {/* Generated Value Preview - adaptive based on contentType */}
            <div className={classNames('ai-inline-result__preview', {
              'ai-inline-result__preview--code': contentType === CONTENT_TYPES.CODE,
              'ai-inline-result__preview--html': contentType === CONTENT_TYPES.HTML
            })}>
              <AdaptiveDiffPreview
                original={originalValue}
                generated={generatedValue}
                contentType={contentType}
                language={language}
                contextType={contextType}
                showDiff={showDiff}
              />
            </div>
          </>
        )}
      </div>

      {/* Retry Input (conditional) */}
      {showRetryInput && !isLoading && (
        <div className="ai-inline-result__retry-row">
          <input
            ref={retryInputRef}
            type="text"
            className="ai-inline-result__retry-input"
            value={retryPrompt}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setRetryPrompt(e.target.value)}
            onKeyDown={handleRetryKeyDown}
            placeholder={t('ai-actions.result.retry-placeholder', 'Describe changes...')}
            disabled={isLoading}
            aria-label={t('ai-actions.result.retry-label', 'Edit instruction')}
          />
          <button
            type="button"
            className="ai-inline-result__retry-submit"
            onClick={handleRetrySubmit}
            disabled={!retryPrompt.trim() || isLoading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Actions - Icon buttons with tooltips */}
      <div className="ai-inline-result__actions">
        {/* Cancel button - enabled during loading to allow cancellation */}
        <button
          type="button"
          className="ai-result-icon-btn"
          onClick={handleCancel}
          disabled={isApplying}
          data-tooltip={isLoading ? t('ai-actions.result.cancel-generation', 'Cancel generation') : t('ai-actions.result.cancel', 'Cancel')}
          aria-label={isLoading ? t('ai-actions.result.cancel-generation', 'Cancel generation') : t('ai-actions.result.cancel', 'Cancel')}
        >
          <CloseIcon />
        </button>

        {/* Another variant button */}
        {onAnotherVariant && (
          <button
            type="button"
            className="ai-result-icon-btn"
            onClick={handleAnotherVariant}
            disabled={isLoading}
            data-tooltip={t('ai-actions.result.another', 'Another variant')}
            aria-label={t('ai-actions.result.another', 'Another variant')}
          >
            <RefreshIcon />
          </button>
        )}

        {/* Edit/Retry button */}
        {onRetry && (
          <button
            type="button"
            className={classNames('ai-result-icon-btn', {
              'ai-result-icon-btn--active': showRetryInput
            })}
            onClick={toggleRetryInput}
            disabled={isLoading}
            data-tooltip={t('ai-actions.result.edit', 'Edit')}
            aria-label={t('ai-actions.result.edit', 'Edit')}
          >
            <EditIcon />
          </button>
        )}

        {/* Apply button */}
        <button
          type="button"
          className="ai-result-icon-btn ai-result-icon-btn--primary"
          onClick={handleApply}
          disabled={isApplying || isLoading}
          data-tooltip={t('ai-actions.result.apply', 'Apply')}
          aria-label={t('ai-actions.result.apply', 'Apply')}
        >
          {isApplying ? (
            <Icon className="fa fa-spinner fa-spin" />
          ) : (
            <CheckIcon />
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Loading fallback for lazy-loaded diff components
 */
const DiffLoadingFallback: React.FC = () => (
  <div className="ai-diff-preview ai-diff-preview--loading">
    <Icon className="fa fa-spinner fa-spin" />
  </div>
);

interface AdaptiveDiffPreviewProps {
  original: string;
  generated: string;
  contentType: ContentType;
  language: string;
  contextType: string;
  showDiff: boolean;
}

/**
 * Adaptive Diff Preview
 * Selects the appropriate diff component based on content type
 */
const AdaptiveDiffPreview: React.FC<AdaptiveDiffPreviewProps> = ({
  original,
  generated,
  contentType,
  language,
  contextType,
  showDiff
}) => {
  // If no diff requested, just show the generated content
  if (!showDiff) {
    // For code, show with basic formatting
    if (contentType === CONTENT_TYPES.CODE) {
      return (
        <pre className="ai-inline-result__code-plain">
          <code>{generated}</code>
        </pre>
      );
    }
    return <>{generated}</>;
  }

  // Select diff component based on content type
  switch (contentType) {
    case CONTENT_TYPES.CODE:
      return (
        <Suspense fallback={<DiffLoadingFallback />}>
          <CodeDiffPreview
            original={original}
            generated={generated}
            language={language}
            contextType={contextType}
          />
        </Suspense>
      );

    case CONTENT_TYPES.HTML:
      return (
        <Suspense fallback={<DiffLoadingFallback />}>
          <HtmlDiffPreview
            original={original}
            generated={generated}
          />
        </Suspense>
      );

    default:
      return <TextDiffPreview original={original} generated={generated} />;
  }
};

interface TextDiffPreviewProps {
  original: string;
  generated: string;
}

/**
 * Text Diff Preview (Compact Inline)
 * Shows only the result with changed/added words highlighted in green
 * Uses the 'diff' library for accurate word-level comparison
 */
const TextDiffPreview: React.FC<TextDiffPreviewProps> = ({ original, generated }) => {
  const diffResult = useMemo((): Change[] => {
    if (!original) {
      return [{ value: generated, added: true, removed: false }];
    }
    // Use diffWords from 'diff' library - returns array of {value, added, removed}
    return diffWords(original, generated);
  }, [original, generated]);

  return (
    <div className="ai-diff-preview ai-diff-preview--compact ai-diff-preview--text">
      {diffResult.map((part, index) => {
        // Skip removed parts - we only show the new text
        if (part.removed) {
          return null;
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
  );
};

export default AIInlineResult;
