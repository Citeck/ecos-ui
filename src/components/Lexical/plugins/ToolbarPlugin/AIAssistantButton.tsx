/**
 * AI Assistant Button for Lexical Toolbar
 */

import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $setSelection, $createParagraphNode, $createTextNode, $insertNodes } from "lexical";
import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html";

import aiAssistantService from "../../../AIAssistant/AIAssistantService";
import AiAssistant from "../../../common/icons/AiAssistant";
import { AI_ASSISTANT_EVENTS, ADDITIONAL_CONTEXT_TYPES, AI_INTENTS } from "../../../AIAssistant/constants";
import editorContextService, { CONTEXT_TYPES } from "../../../AIAssistant/EditorContextService";

import { t } from "@/helpers/export/util";

interface AIAssistantButtonProps {
  disabled?: boolean;
  currentText?: string;
  recordRef?: string;
  attribute?: string;
}

export default function AIAssistantButton(
  {
    disabled = false,
    recordRef, attribute
  }: AIAssistantButtonProps): React.JSX.Element | null {
  const [isAvailable, setIsAvailable] = useState(false);
  const [editor] = useLexicalComposerContext();
  const ref = recordRef ? recordRef.split("-alias-")[0] : null;

  useEffect(() => {
    let isMounted = true;

    const checkAvailability = async () => {
      const available = await aiAssistantService.isAvailable() && !!ref && !!attribute;
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
  }, [ref, attribute, editor]);

  useEffect(() => {
    return () => {
      // Clear context when component unmounts
      const currentContextData = editorContextService.getContextData();
      if (currentContextData.forceIntent === AI_INTENTS.TEXT_EDITING &&
        currentContextData.recordRef === ref &&
        currentContextData.attribute === attribute) {
        editorContextService.clearContext();
      }
    };
  }, []);

  const updateLexicalContent = (newText: string) => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      if (newText.includes("<") && newText.includes(">")) {
        try {
          const parser = new DOMParser();
          const dom = parser.parseFromString(newText, "text/html");

          const nodes = $generateNodesFromDOM(editor, dom);

          root.select();
          $insertNodes(nodes);
        } catch (error) {
          console.warn("Failed to parse HTML content, falling back to plain text:", error);
          // Fallback to plain text
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(newText);
          paragraph.append(textNode);
          root.append(paragraph);
        }
      } else {
        // Plain text content
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(newText);
        paragraph.append(textNode);
        root.append(paragraph);
      }

      // Clear selection to avoid issues
      $setSelection(null);
    });
  };

  const handleClick = async () => {
    if (disabled) {
      return;
    }

    if (!isAvailable) {
      alert("AI Assistant недоступен. Проверьте подключение к серверу.");
      return;
    }

    // Register universal context with forceIntent for text editor
    editorContextService.setContext(
      CONTEXT_TYPES.UNIVERSAL,
      {
        updateLexicalContent: updateLexicalContent,
        getCurrentText: () => {
          let text = "";
          editor.read(() => {
            text = $generateHtmlFromNodes(editor, null);
          });
          return text;
        }
      },
      {
        recordRef: ref,
        attribute,
        editor,
        forceIntent: AI_INTENTS.TEXT_EDITING
      }
    );

    // Open universal AI assistant chat
    aiAssistantService.toggleChat();

    // Automatically add record and attribute to context
    setTimeout(() => {
      // Add record to context
      if (recordRef) {
        window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
          detail: {
            contextType: ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
            recordRef
          }
        }));
      }

      // Add attribute to context
      if (attribute) {
        window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
          detail: {
            contextType: ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES,
            recordRef: recordRef || "",
            attribute: attribute
          }
        }));
      }
    }, 100);
  };

  return isAvailable ? (
    <button
      disabled={disabled}
      onClick={handleClick}
      className={classNames("toolbar-item", "spaced", "ai-assistant-button")}
      title={t("lexical.plugins.toolbar.ai-assistant", "AI Assistant")}
      type="button"
      aria-label={t("lexical.plugins.toolbar.ai-assistant-label", "Open AI Assistant")}
    >
      <AiAssistant />
    </button>
  ) : null;
}
