/**
 * AI Floating Popup - renders independently from floating toolbar.
 *
 * NOTE: This component doesn't use AIFieldActions because Lexical's floating toolbar
 * unmounts when selection changes - the popup must live separately to survive during
 * AI generation. Uses window events (AI_FLOATING_POPUP_OPEN) for communication between
 * the toolbar button and this popup. Reuses useAIFieldActions hook for all AI logic.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { $generateNodesFromDOM } from '@lexical/html';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $insertNodes,
  $setSelection,
  LexicalEditor
} from 'lexical';
// @ts-ignore - uuidv4 doesn't have types
import uuidV4 from 'uuidv4';

import AIActionsBar from '../../../AIAssistant/AIQuickActions/components/AIActionsBar';
import AIInlineResult from '../../../AIAssistant/AIQuickActions/components/AIInlineResult';
import AIPopperWrapper from '../../../AIAssistant/AIQuickActions/components/AIPopperWrapper';
import useAIFieldActions from '../../../AIAssistant/AIQuickActions/hooks/useAIFieldActions';
import { FIELD_TYPES, RESULT_MODES } from '@/components/AIAssistant/AIQuickActions';
import { CONTENT_TYPES } from '@/components/AIAssistant/constants';
import { useLexicalAIGenerateWithRefs } from '../../hooks/useLexicalAIGenerate';

// Event name for opening popup
export const AI_FLOATING_POPUP_OPEN = 'ai-floating-popup-open';

interface OpenEventDetail {
  editor: LexicalEditor;
  triggerRect: DOMRect;
  selectedText: string;
  currentValue: string;
  recordRef: string;
  attribute: string;
}

/**
 * Create a virtual element for Popper.js from a stored rect
 */
const createVirtualElement = (rect: DOMRect): HTMLElement => {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => rect;
  el.style.position = 'fixed';
  el.style.top = `${rect.top}px`;
  el.style.left = `${rect.left}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
  el.style.pointerEvents = 'none';
  el.style.visibility = 'hidden';
  document.body.appendChild(el);
  return el;
};

export default function AIFloatingPopup() {
  const [virtualElement, setVirtualElement] = useState<HTMLElement | null>(null);
  // Ref for cleanup to avoid stale closure issues
  const virtualElementRef = useRef<HTMLElement | null>(null);

  // Refs for storing event data
  const editorRef = useRef<LexicalEditor | null>(null);
  const currentValueRef = useRef('');

  // State for reactive hook consumption (fixes stale closure issue #2)
  const [contextValues, setContextValues] = useState({
    recordRef: '',
    selectedText: ''
  });

  // Use centralized AI generate hook with refs for dynamic context
  const { contextRef, handleGenerateRequest } = useLexicalAIGenerateWithRefs();

  // getValue reads from ref (set by event)
  const getValue = useCallback(() => currentValueRef.current, []);

  // setValue updates Lexical editor
  const setValue = useCallback((newText: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.update(() => {
      const root = $getRoot();
      root.clear();

      if (newText.includes('<') && newText.includes('>')) {
        try {
          const parser = new DOMParser();
          const dom = parser.parseFromString(newText, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          root.select();
          $insertNodes(nodes);
        } catch (error) {
          console.warn('Failed to parse HTML content, falling back to plain text:', error);
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(newText);
          paragraph.append(textNode);
          root.append(paragraph);
        }
      } else {
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(newText);
        paragraph.append(textNode);
        root.append(paragraph);
      }

      $setSelection(null);
    });
  }, []);

  // Use unified hook for all AI logic
  const {
    isActionsBarVisible,
    isResultVisible,
    isGenerating,
    isApplying,
    result,
    fieldConfig,
    availableActions,
    openActionsBar,
    closeActionsBar,
    closeResult,
    handleQuickAction,
    handlePromptSubmit,
    applyResult,
    retryGeneration,
    requestAnotherVariant,
  } = useAIFieldActions({
    fieldType: FIELD_TYPES.RICHTEXT,
    getValue,
    setValue,
    recordRef: contextValues.recordRef,
    selectedText: contextValues.selectedText,
    onGenerateRequest: handleGenerateRequest,
    disabled: false,
  });

  // Cleanup virtual element using ref to avoid stale closure issues
  const cleanupVirtualElement = useCallback(() => {
    if (virtualElementRef.current && virtualElementRef.current.parentNode) {
      virtualElementRef.current.parentNode.removeChild(virtualElementRef.current);
    }
    virtualElementRef.current = null;
    setVirtualElement(null);
  }, []);

  // Extended close handlers that also cleanup virtual element
  const handleCloseActionsBar = useCallback(() => {
    closeActionsBar();
    cleanupVirtualElement();
  }, [closeActionsBar, cleanupVirtualElement]);

  const handleCloseResult = useCallback(() => {
    closeResult();
    cleanupVirtualElement();
  }, [closeResult, cleanupVirtualElement]);

  // Listen for open event
  useEffect(() => {
    const handleOpen = (e: CustomEvent<OpenEventDetail>) => {
      const { editor, triggerRect, selectedText, currentValue, recordRef, attribute } = e.detail;

      // Store event data in refs
      editorRef.current = editor;
      currentValueRef.current = currentValue;

      // Update AI context ref
      contextRef.current = {
        recordRef,
        attribute,
        selectedText,
        conversationId: uuidV4()
      };

      // Update state for reactive hook consumption
      setContextValues({
        recordRef,
        selectedText
      });

      // Create virtual element for Popper positioning
      const el = createVirtualElement(triggerRect);
      virtualElementRef.current = el;
      setVirtualElement(el);

      // Open actions bar via hook
      openActionsBar();
    };

    window.addEventListener(AI_FLOATING_POPUP_OPEN, handleOpen as EventListener);
    return () => {
      window.removeEventListener(AI_FLOATING_POPUP_OPEN, handleOpen as EventListener);
    };
  }, [openActionsBar, contextRef]);

  // Cleanup on unmount - use cleanup function to avoid stale closure
  useEffect(() => {
    return () => {
      cleanupVirtualElement();
    };
  }, [cleanupVirtualElement]);

  const isPopupVisible = isActionsBarVisible || isResultVisible;

  const showDiff =
    fieldConfig.resultMode === RESULT_MODES.INLINE_DIFF &&
    result.originalValue?.trim() !== result.generatedValue?.trim();

  if (!isPopupVisible || !virtualElement) {
    return null;
  }

  return (
    <AIPopperWrapper isVisible={isPopupVisible} referenceElement={virtualElement} variant="lexical" stickyPosition={true}>
      <div className="ai-floating-popup">
        {isActionsBarVisible && !isResultVisible && (
          <AIActionsBar
            isVisible={true}
            quickActions={availableActions}
            placeholder={typeof fieldConfig.getPlaceholder === "function" ? fieldConfig.getPlaceholder() : ""}
            isLoading={isGenerating}
            disabled={false}
            onQuickAction={handleQuickAction}
            onSubmit={handlePromptSubmit}
            onClose={handleCloseActionsBar}
          />
        )}
        {isResultVisible && (
          <AIInlineResult
            isVisible={true}
            originalValue={result.originalValue}
            generatedValue={result.generatedValue}
            explanation={result.explanation}
            isLoading={isGenerating}
            isApplying={isApplying}
            onApply={applyResult}
            onCancel={handleCloseResult}
            onRetry={retryGeneration}
            onAnotherVariant={requestAnotherVariant}
            showDiff={showDiff}
            contentType={CONTENT_TYPES.HTML}
            className=""
          />
        )}
      </div>
    </AIPopperWrapper>
  );
}
