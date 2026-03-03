/**
 * AIFieldActions Component
 * Main wrapper component that provides universal AI quick actions for any field type
 * Combines trigger, actions bar, and result display
 * Supports smart positioning with automatic flip when near viewport edges
 */

import React, { useCallback, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import AIFieldTrigger from './AIFieldTrigger';
import AIActionsBar from './AIActionsBar';
import AIInlineResult from './AIInlineResult';
import AIPopperWrapper from './AIPopperWrapper';
import useAIFieldActions from '../hooks/useAIFieldActions';
import { RESULT_MODES, TRIGGER_POSITIONS, getContentType, ContentType } from '../config/fieldActionConfigs';
import { GenerateRequestParams, GenerateResult } from '../hooks/useAIFieldActions';

type PositionVariant = 'text-field' | 'script-editor' | 'lexical';

export interface AIFieldActionsProps {
  fieldType: string;
  getValue: () => string;
  setValue: (value: string) => void;
  recordRef?: string;
  contextType?: string;
  contentType?: ContentType;
  language?: string;
  additionalContext?: Record<string, unknown>;
  onGenerateRequest?: (params: GenerateRequestParams) => Promise<GenerateResult>;
  disabled?: boolean;
  actionsBarContainer?: HTMLElement | null;
  resultContainer?: HTMLElement | null;
  triggerElement?: HTMLElement | null;
  positionVariant?: PositionVariant;
  useSmartPosition?: boolean;
  triggerIcon?: ReactNode;
  triggerClassName?: string;
  selectedText?: string;
  onTriggerClick?: () => void;
  stickyPosition?: boolean;
  preventSelectionLoss?: boolean;
  noWrapper?: boolean;
  popperClassName?: string;
  className?: string;
  children?: ReactNode;
  onRegisterClose?: (closeFn: () => void) => void;
}

const AIFieldActions: React.FC<AIFieldActionsProps> = ({
  fieldType,
  getValue,
  setValue,
  recordRef,
  contextType,
  contentType: contentTypeProp,
  language = 'javascript',
  additionalContext = {},
  onGenerateRequest,
  disabled = false,
  actionsBarContainer,
  resultContainer,
  triggerElement: externalTriggerElement,
  positionVariant,
  useSmartPosition = true,
  triggerIcon,
  triggerClassName,
  selectedText = '',
  onTriggerClick,
  stickyPosition = false,
  preventSelectionLoss = false,
  noWrapper = false,
  popperClassName,
  className,
  children,
  onRegisterClose
}) => {
  // Internal ref for trigger when no external element provided
  const internalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [internalTriggerElement, setInternalTriggerElement] = useState<HTMLButtonElement | null>(null);

  // Use external trigger element or internal one
  const triggerElement = externalTriggerElement || internalTriggerElement;

  // Determine position variant based on field type
  const effectivePositionVariant = useMemo((): PositionVariant => {
    if (positionVariant) return positionVariant;
    if (fieldType === 'code') return 'script-editor';
    if (fieldType === 'richtext') return 'lexical';
    return 'text-field';
  }, [positionVariant, fieldType]);

  // Should we use smart positioning?
  const shouldUseSmartPosition = useSmartPosition && triggerElement;
  const {
    // State
    isAvailable,
    isActionsBarVisible,
    isResultVisible,
    isGenerating,
    isApplying,
    result,

    // Configuration
    fieldConfig,
    availableActions,

    // Actions
    openActionsBar,
    closeActionsBar,
    closeResult,
    cancelGeneration,
    handleQuickAction,
    handlePromptSubmit,
    applyResult,
    retryGeneration,
    requestAnotherVariant
  } = useAIFieldActions({
    fieldType,
    getValue,
    setValue,
    recordRef,
    contextType,
    additionalContext,
    onGenerateRequest,
    selectedText,
    disabled
  });

  // Register close function for external callers (e.g., when another toolbar action is triggered)
  useEffect(() => {
    if (onRegisterClose) {
      onRegisterClose(() => {
        cancelGeneration();
      });
    }
  }, [onRegisterClose, cancelGeneration]);

  // Determine content type - use prop override or get from config
  const contentType = useMemo(
    () => contentTypeProp || getContentType(fieldType),
    [contentTypeProp, fieldType]
  );

  // Handle trigger click
  const handleTriggerClick = useCallback(() => {
    if (isActionsBarVisible) {
      closeActionsBar();
    } else {
      // Call custom callback before opening (e.g., to save selection)
      if (typeof onTriggerClick === 'function') {
        onTriggerClick();
      }
      openActionsBar();
    }
  }, [isActionsBarVisible, closeActionsBar, openActionsBar, onTriggerClick]);

  // Get placeholder text
  const placeholder = useMemo(() => {
    return typeof fieldConfig.getPlaceholder === 'function'
      ? fieldConfig.getPlaceholder()
      : '';
  }, [fieldConfig]);

  // Show diff for textarea fields only when content actually changed (ignoring leading/trailing whitespace)
  const showDiff =
    fieldConfig.resultMode === RESULT_MODES.INLINE_DIFF &&
    result.originalValue?.trim() !== result.generatedValue?.trim();

  // Calculate content metrics for adaptive popup width
  const resultContentMetrics = useMemo(() => {
    const generatedLength = result.generatedValue?.length || 0;
    const explanationLength = result.explanation?.length || 0;
    return {
      length: generatedLength + explanationLength,
      type: contentType,
      hasExplanation: !!result.explanation
    };
  }, [result.generatedValue, result.explanation, contentType]);

  // Callback ref for internal trigger - only update state if node changed
  const handleTriggerRef = useCallback((node: HTMLButtonElement | null) => {
    if (internalTriggerRef.current !== node) {
      internalTriggerRef.current = node;
      setInternalTriggerElement(node);
    }
  }, []);

  // Don't render if AI is not available
  if (!isAvailable) {
    return <>{children}</> || null;
  }

  // Render actions bar content
  const actionsBarElement = (
    <AIActionsBar
      isVisible={isActionsBarVisible}
      quickActions={availableActions}
      placeholder={placeholder}
      isLoading={isGenerating}
      disabled={disabled}
      onQuickAction={handleQuickAction}
      onSubmit={handlePromptSubmit}
      onClose={closeActionsBar}
      variant={fieldConfig.triggerPosition === TRIGGER_POSITIONS.FLOATING ? 'code-editor' : 'default'}
    />
  );

  // Render result display (with optional portal)
  const resultElement = (
    <AIInlineResult
      isVisible={isResultVisible}
      originalValue={result.originalValue}
      generatedValue={result.generatedValue}
      explanation={result.explanation}
      isLoading={isGenerating}
      isApplying={isApplying}
      onApply={applyResult}
      onCancel={closeResult}
      onCancelGeneration={cancelGeneration}
      onRetry={retryGeneration}
      onAnotherVariant={requestAnotherVariant}
      showDiff={showDiff}
      contentType={contentType}
      language={language}
      contextType={contextType}
      className=""
    />
  );

  // Render popup with smart positioning (via Popper) or legacy portal
  const renderPopup = (
    content: ReactNode,
    container: HTMLElement | null | undefined,
    isVisible: boolean,
    contentMetrics?: { length: number; type: ContentType; hasExplanation: boolean }
  ): ReactNode => {
    // Smart positioning: use AIPopperWrapper (renders to body via portal)
    if (shouldUseSmartPosition) {
      return (
        <AIPopperWrapper
          isVisible={isVisible}
          referenceElement={triggerElement}
          variant={effectivePositionVariant}
          stickyPosition={stickyPosition}
          contentLength={contentMetrics?.length}
          contentType={contentMetrics?.type}
          hasExplanation={contentMetrics?.hasExplanation}
          className={popperClassName}
        >
          {content}
        </AIPopperWrapper>
      );
    }
    // Legacy: use provided container via portal
    if (container) {
      return ReactDOM.createPortal(content, container);
    }
    // Fallback: render inline
    return content;
  };

  const content = (
    <>
      {/* Trigger Button */}
      <AIFieldTrigger
        ref={handleTriggerRef}
        position={fieldConfig.triggerPosition}
        isActive={isActionsBarVisible || isResultVisible}
        isGenerating={isGenerating}
        disabled={disabled}
        onClick={handleTriggerClick}
        customIcon={triggerIcon}
        triggerClassName={triggerClassName}
        preventSelectionLoss={preventSelectionLoss}
      />

      {/* Actions Bar */}
      {renderPopup(actionsBarElement, actionsBarContainer, isActionsBarVisible && !isResultVisible)}

      {/* Result Display - pass content metrics for adaptive width */}
      {renderPopup(resultElement, resultContainer, isResultVisible, resultContentMetrics)}

      {/* Children (the actual field) */}
      {children}
    </>
  );

  // For floating toolbars, don't render wrapper to preserve flex layout
  if (noWrapper) {
    return content;
  }

  return (
    <div className={classNames('ai-field-actions', className)}>
      {content}
    </div>
  );
};

export default AIFieldActions;
