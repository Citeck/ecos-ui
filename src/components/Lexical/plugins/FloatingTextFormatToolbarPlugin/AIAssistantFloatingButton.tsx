import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $setSelection,
  LexicalEditor
} from "lexical";
import { useCallback, useEffect, useState } from "react";

import AiAssistant from "../../../common/icons/AiAssistant";
import aiAssistantService from "../../../AIAssistant/AIAssistantService";
import { AI_ASSISTANT_EVENTS, ADDITIONAL_CONTEXT_TYPES, AI_INTENTS } from "../../../AIAssistant/constants";
import editorContextService, { CONTEXT_TYPES } from "../../../AIAssistant/EditorContextService";

interface AIAssistantFloatingButtonProps {
  editor: LexicalEditor;
  recordRef?: string;
  attribute?: string;
}

export default function AIAssistantFloatingButton({ editor, recordRef, attribute }: AIAssistantFloatingButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);
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
  }, [ref, attribute]);

  const handleAIAssistant = useCallback(() => {
    let selectedText = "";
    let selectedHtml = "";

    // First, read the selection data
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        return;
      }

      selectedText = selection.getTextContent();
    });

    // If we have valid selection, generate HTML outside of read context
    if (selectedText) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          selectedHtml = $generateHtmlFromNodes(editor, selection);
        }
      });

      // Register context with selected text information
      editorContextService.setContext(
        CONTEXT_TYPES.UNIVERSAL,
        {
          updateLexicalContent: (newText: string) => {
            // This would update the entire document content
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
          },
          getCurrentText: () => {
            let text = "";
            editor.update(() => {
              text = $generateHtmlFromNodes(editor, null);
            });
            return text;
          }
        },
        {
          recordRef: ref,
          attribute,
          editor,
          forceIntent: AI_INTENTS.TEXT_EDITING,
          selectionContext: {
            text: selectedText,
            html: selectedHtml
          }
        }
      );

      // Open AI assistant chat (only open, don't toggle)
      aiAssistantService.openChat();

      // Automatically add record and selection context
      setTimeout(() => {
        // Add record to context if available
        if (recordRef) {
          window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
            detail: {
              contextType: ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
              recordRef
            }
          }));
        }

        // Add attribute to context if available
        if (attribute) {
          window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENTS.ADD_CONTEXT, {
            detail: {
              contextType: ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES,
              recordRef: recordRef || "",
              attribute: attribute
            }
          }));
        }

        // Add reference to selected text in the chat input
        window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENTS.ADD_TEXT_REFERENCE, {
          detail: {
            reference: `выделенный_текст`,
            selectedText
          }
        }));
      }, 100);
    }
  }, [editor, ref, attribute]);

  if (!isAvailable) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleAIAssistant}
      className={"popup-item spaced ai-assistant-selection"}
      title="Использовать выделенный текст в AI Assistant"
      aria-label="Use selected text in AI Assistant"
    >
      <AiAssistant />
    </button>
  );
}
