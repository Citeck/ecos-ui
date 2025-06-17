import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, $isParagraphNode } from 'lexical';
import { useDebounce } from 'use-debounce';

import { $isImageNode } from '../nodes/ImageNode';
import useLayoutEffect from '../shared/useLayoutEffect';

type Options = {
  timeoutMs?: number;
};

const useSyncWithInputHtml = (html?: string | null, { timeoutMs = 800 }: Options = {}) => {
  const [editor] = useLexicalComposerContext();
  const [debHtml] = useDebounce(html, timeoutMs);
  const normHtml = editor.getEditorState().isEmpty() ? html : debHtml;

  useLayoutEffect(() => {
    editor.update(() => {
      if ($generateHtmlFromNodes(editor, null) !== normHtml) {
        $getRoot().clear();
        const phNode = $createParagraphNode();
        phNode.append($createTextNode(''));
        $getRoot().append(phNode);

        const parser = new DOMParser();
        const dom = parser.parseFromString(normHtml ?? '', 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          selection.insertNodes(nodes);

          const root = $getRoot();
          const children = root.getChildren();

          if (children.length > 1) {
            const first = children[0];
            if ($isParagraphNode(first) && first.getTextContent() === '' && !first.getChildren().some(child => $isImageNode(child))) {
              first.remove();
            }

            const updatedChildren = root.getChildren();
            const last = updatedChildren[updatedChildren.length - 1];
            if ($isParagraphNode(last) && last.getTextContent() === '' && !last.getChildren().some(child => $isImageNode(child))) {
              last.remove();
            }
          }
        }
      }
    });
  }, [normHtml]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useSyncWithInputHtml;
