import { $convertFromMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isParagraphNode, COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from 'lexical';
import { useEffect } from 'react';

import { PLAYGROUND_TRANSFORMERS } from '../MarkdownTransformers';

// Heuristic: check for markdown patterns. Requires at least 2 different patterns to avoid false positives.
export function isLikelyMarkdown(text: string): boolean {
  const patterns = [
    /^#{1,6}\s/m, // headings
    /\*\*[^*]+\*\*/, // bold
    /(?<!\*)\*[^*\n]+\*(?!\*)/, // italic (single line only)
    /^[-*]\s/m, // unordered list
    /^\d+\.\s/m, // ordered list
    /^>\s/m, // blockquote
    /```[\s\S]*?```/, // code block (fenced)
    /\[.+\]\(.+\)/, // links
    /^---$|^\*\*\*$/m, // horizontal rule
    /\|.+\|.+\|/ // table
  ];

  let matchCount = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      matchCount++;
      if (matchCount >= 2) return true;
    }
  }
  return false;
}

function $isEditorEmpty(): boolean {
  const root = $getRoot();
  const children = root.getChildren();
  if (children.length > 1) return false;
  if ($isParagraphNode(children[0])) {
    return children[0].getChildren().length === 0;
  }
  return false;
}

export default function MarkdownPastePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // If HTML is present, skip — standard handler will do better
        const htmlData = clipboardData.getData('text/html');
        if (htmlData) return false;

        const textData = clipboardData.getData('text/plain');
        if (!textData) return false;

        if (!isLikelyMarkdown(textData)) return false;

        // Check that editor is empty (only convert markdown in a clean editor)
        const isEmpty = editor.getEditorState().read($isEditorEmpty);
        if (!isEmpty) return false;

        // Convert markdown
        try {
          editor.update(() => {
            $convertFromMarkdownString(textData, PLAYGROUND_TRANSFORMERS);
          });
          event.preventDefault();
          return true;
        } catch {
          // Let the default paste handler take over
          return false;
        }
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
