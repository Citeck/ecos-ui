/**
 * AI Assistant Button for Lexical Toolbar
 * Uses inline AI quick actions for unified UX
 */

import { $generateNodesFromDOM, $generateHtmlFromNodes } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $setSelection, $createParagraphNode, $createTextNode, $insertNodes } from 'lexical';
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
// @ts-ignore - uuidv4 doesn't have types
import uuidV4 from 'uuidv4';

import aiAssistantService from '../../../AIAssistant/AIAssistantService';
import { AIFieldActions } from '../../../AIAssistant/AIQuickActions/components';
import { FIELD_TYPES } from "@/components/AIAssistant";
import { CONTENT_TYPES } from "@/components/AIAssistant";
import AiAssistant from '../../../common/icons/global/AiAssistant';
import { useLexicalAIGenerate } from '../../hooks/useLexicalAIGenerate';

interface AIAssistantButtonProps {
  disabled?: boolean;
  recordRef?: string;
  attribute?: string;
  resultContainer?: HTMLElement | null;
}

export default function AIAssistantButton({
  disabled = false,
  recordRef,
  attribute,
  resultContainer
}: AIAssistantButtonProps): React.JSX.Element | null {
  const [isAvailable, setIsAvailable] = useState(false);
  const [editor] = useLexicalComposerContext();
  const ref = recordRef ? recordRef.split('-alias-')[0] : null;
  const conversationIdRef = useRef(uuidV4());

  useEffect(() => {
    let isMounted = true;

    const checkAvailability = async () => {
      const available = (await aiAssistantService.isAvailable()) && !!ref && !!attribute;
      if (isMounted) {
        setIsAvailable(available);
      }
    };

    const handleAvailabilityChange = async () => {
      await checkAvailability();
    };

    checkAvailability();
    aiAssistantService.addAvailabilityListener(handleAvailabilityChange);

    return () => {
      isMounted = false;
      aiAssistantService.removeAvailabilityListener(handleAvailabilityChange);
    };
  }, [ref, attribute]);

  /**
   * Update Lexical editor content with HTML
   */
  const updateLexicalContent = useCallback((newText: string) => {
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
  }, [editor]);

  /**
   * Get current HTML content from editor
   */
  const getValue = useCallback(() => {
    let html = '';
    editor.read(() => {
      html = $generateHtmlFromNodes(editor, null);
    });
    return html;
  }, [editor]);

  // Memoize context to avoid recreating on every render
  const aiContext = useMemo(() => ({
    recordRef: ref || '',
    attribute,
    conversationId: conversationIdRef.current
  }), [ref, attribute]);

  // Use centralized AI generate hook
  const handleGenerateRequest = useLexicalAIGenerate(aiContext);

  if (!isAvailable) {
    return null;
  }

  return (
    <AIFieldActions
      fieldType={FIELD_TYPES.RICHTEXT}
      getValue={getValue}
      setValue={updateLexicalContent}
      recordRef={ref || ''}
      contentType={CONTENT_TYPES.HTML}
      onGenerateRequest={handleGenerateRequest}
      disabled={disabled}
      resultContainer={resultContainer || undefined}
      triggerIcon={<AiAssistant />}
      triggerClassName="toolbar-item spaced ai-assistant-button"
      positionVariant="lexical"
    />
  );
}
