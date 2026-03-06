/**
 * AI Assistant Floating Button for Lexical Selection
 * Simple button that triggers AI popup via event
 * Popup is rendered independently to survive toolbar unmount
 */

import { $generateHtmlFromNodes } from '@lexical/html';
import { $getSelection, $isRangeSelection, LexicalEditor } from 'lexical';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import aiAssistantService from '../../../AIAssistant/AIAssistantService';
import AiAssistant from '../../../common/icons/global/AiAssistant';
import { AI_FLOATING_POPUP_OPEN } from './AIFloatingPopup';

interface AIAssistantFloatingButtonProps {
  editor: LexicalEditor;
  recordRef?: string;
  attribute?: string;
}

export default function AIAssistantFloatingButton({ editor, recordRef, attribute }: AIAssistantFloatingButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ref = recordRef ? recordRef.split('-alias-')[0] : null;

  useEffect(() => {
    let isMounted = true;

    const checkAvailability = async () => {
      const available = (await aiAssistantService.isAvailable()) && !!ref && !!attribute;
      if (isMounted) {
        setIsAvailable(available);
      }
    };

    checkAvailability();
    aiAssistantService.addAvailabilityListener(checkAvailability);

    return () => {
      isMounted = false;
      aiAssistantService.removeAvailabilityListener(checkAvailability);
    };
  }, [ref, attribute]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Get trigger position before anything changes
      const triggerRect = buttonRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      // Get selection and current value
      let selectedText = '';
      let currentValue = '';

      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          selectedText = $generateHtmlFromNodes(editor, selection);
        }
        currentValue = $generateHtmlFromNodes(editor, null);
      });

      // Dispatch event to open popup
      window.dispatchEvent(
        new CustomEvent(AI_FLOATING_POPUP_OPEN, {
          detail: {
            editor,
            triggerRect,
            selectedText,
            currentValue,
            recordRef: ref || '',
            attribute: attribute || ''
          }
        })
      );
    },
    [editor, ref, attribute]
  );

  // Prevent selection loss on mousedown
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  if (!isAvailable) {
    return null;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className="popup-item spaced ai-assistant-selection"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      title="AI Assistant"
      aria-label="AI Assistant"
    >
      <AiAssistant />
    </button>
  );
}
